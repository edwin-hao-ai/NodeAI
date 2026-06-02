use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use nodeai_core::{CompressionProfile, ModelCatalogEntry, TrafficPath};
use serde_json::{json, Value};

use crate::auth::parse_nodeai_app_key;
use crate::pipeline::parse_memory_header;
use crate::ProxyState;

pub fn router() -> Router<ProxyState> {
    Router::new()
        .route("/health", get(health))
        .route("/v1/nodeai/usage", get(usage_stats))
        .route("/v1/nodeai/bonus", get(get_bonus).put(set_bonus))
        .route("/v1/models", get(list_models))
        .route("/v1/chat/completions", post(chat_completions))
        .route("/v1/embeddings", post(not_implemented))
}

async fn health(State(state): State<ProxyState>) -> impl IntoResponse {
    let profile = state.bonus.get_profile();
    let bonus = state.usage.bonus_totals();
    Json(json!({
        "ok": true,
        "service": "nodeai-proxy",
        "gateway": {
            "configured": state.gateway.is_some(),
            "models": state.catalog.len(),
        },
        "bonus": {
            "rtk": profile.rtk,
            "caveman_level": profile.caveman_level,
            "memory_inject": profile.memory_inject,
            "metrics": bonus,
        }
    }))
}

async fn usage_stats(State(state): State<ProxyState>) -> Json<Value> {
    let snap = state.usage.full_snapshot();
    Json(json!({
        "apps": snap.apps,
        "bonus": snap.bonus,
    }))
}

async fn get_bonus(State(state): State<ProxyState>) -> Json<CompressionProfile> {
    Json(state.bonus.get_profile())
}

async fn set_bonus(
    State(state): State<ProxyState>,
    Json(profile): Json<CompressionProfile>,
) -> Json<CompressionProfile> {
    state.bonus.set_profile(profile.clone());
    Json(profile)
}

async fn list_models(State(state): State<ProxyState>) -> Json<Value> {
    let data: Vec<ModelCatalogEntry> = (*state.catalog).clone();
    Json(json!({
        "object": "list",
        "data": data,
    }))
}

fn bearer_token(headers: &HeaderMap) -> Option<String> {
    headers
        .get("authorization")
        .and_then(|v| v.to_str().ok())
        .map(|s| s.to_string())
}

fn resolve_traffic(
    auth: Option<&str>,
    gateway_ready: bool,
    force_byok: bool,
) -> (TrafficPath, Option<String>) {
    let app_slug = parse_nodeai_app_key(auth).map(|k| k.app_slug);
    if force_byok {
        return (TrafficPath::ByokLocal, app_slug);
    }
    if gateway_ready {
        return (TrafficPath::HostedQuota, app_slug);
    }
    if app_slug.is_some() {
        (TrafficPath::ByokLocal, app_slug)
    } else {
        (TrafficPath::HostedQuota, None)
    }
}

fn apply_request_pipeline(
    state: &ProxyState,
    headers: &HeaderMap,
    body: &mut Value,
) -> nodeai_core::BonusApplyResult {
    let profile = state.bonus.get_profile();
    let smart = profile.smart_route
        || headers
            .get("x-nodeai-smart-route")
            .and_then(|v| v.to_str().ok())
            == Some("1");
    if smart {
        let intent = headers
            .get("x-nodeai-intent")
            .and_then(|v| v.to_str().ok());
        crate::smart_route::apply_smart_route(body, intent, &profile);
    }

    let result = apply_bonus_pipeline(state, headers, body);
    if let Err(err) = state.db.persist(&state.usage.full_snapshot()) {
        tracing::warn!(%err, "usage db persist failed");
    }
    result
}

fn apply_bonus_pipeline(
    state: &ProxyState,
    headers: &HeaderMap,
    body: &mut Value,
) -> nodeai_core::BonusApplyResult {
    let memories = parse_memory_header(
        headers
            .get("x-nodeai-memories")
            .and_then(|v| v.to_str().ok()),
    );
    let result = state.bonus.transform_body(body, &memories);
    state.usage.record_bonus(&result);
    if result.rtk_applied || result.caveman_applied || result.memory_injected {
        tracing::info!(
            rtk = result.rtk_applied,
            rtk_saved = result.rtk_tokens_saved,
            caveman = result.caveman_applied,
            memory = result.memory_injected,
            "bonus pipeline"
        );
    }
    result
}

async fn chat_completions(
    State(state): State<ProxyState>,
    headers: HeaderMap,
    Json(mut body): Json<Value>,
) -> Response {
    let auth = bearer_token(&headers);
    let force_byok = std::env::var("NODEAI_FORCE_BYOK")
        .ok()
        .is_some_and(|v| v == "1" || v.eq_ignore_ascii_case("true"));
    let gateway_ready = state.gateway.is_some();
    let (path, app_slug) = resolve_traffic(auth.as_deref(), gateway_ready, force_byok);
    let model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("unknown")
        .to_string();

    if let Some(slug) = app_slug.as_deref() {
        state.usage.record(slug);
    }

    let bonus = apply_request_pipeline(&state, &headers, &mut body);

    tracing::info!(?path, ?app_slug, %model, gateway_ready, "chat completion");

    match path {
        TrafficPath::HostedQuota => {
            if let Some(gw) = state.gateway.as_ref() {
                match crate::gateway::chat_completions(gw, &body, app_slug.as_deref()).await {
                    Ok(resp) => return attach_bonus_header(resp, &bonus),
                    Err(err) => {
                        tracing::error!(%err, "AI Gateway chat forward failed");
                        return gateway_error(&err).into_response();
                    }
                }
            }
            hosted_quota_unavailable().into_response()
        }
        TrafficPath::ByokLocal => {
            let slug = app_slug.unwrap_or_default();
            byok_chat_completions(&state, &headers, body, &slug, bonus).await
        }
    }
}

fn attach_bonus_header(
    resp: Response<axum::body::Body>,
    bonus: &nodeai_core::BonusApplyResult,
) -> Response<axum::body::Body> {
    let (mut parts, body) = resp.into_parts();
    parts.headers.insert(
        "x-nodeai-bonus",
        format!(
            "rtk={};saved={};caveman={};memory={}",
            bonus.rtk_applied as u8,
            bonus.rtk_tokens_saved,
            bonus.caveman_applied as u8,
            bonus.memory_injected as u8
        )
        .parse()
        .unwrap_or_else(|_| "rtk=0".parse().unwrap()),
    );
    Response::from_parts(parts, body)
}

fn gateway_error(message: &str) -> (StatusCode, Json<Value>) {
    (
        StatusCode::BAD_GATEWAY,
        Json(json!({
            "error": {
                "message": message,
                "type": "nodeai_gateway_error",
                "code": "gateway_upstream_error"
            }
        })),
    )
}

fn hosted_quota_unavailable() -> (StatusCode, Json<Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "error": {
                "message": "Allowance path is not configured. Set AI_GATEWAY_API_KEY in .env and restart NodeAI.",
                "type": "nodeai_not_configured",
                "code": "cloud_api_pending"
            }
        })),
    )
}

async fn byok_chat_completions(
    state: &ProxyState,
    headers: &HeaderMap,
    body: Value,
    app_slug: &str,
    bonus: nodeai_core::BonusApplyResult,
) -> Response {
    if let Some(upstream) = state.config.byok_upstream_url.as_deref() {
        match forward_byok_upstream(upstream, headers, &body, app_slug).await {
            Ok(resp) => return attach_bonus_header(resp, &bonus),
            Err(err) => {
                tracing::warn!(%err, app_slug, "BYOK upstream forward failed");
                return (
                    StatusCode::BAD_GATEWAY,
                    Json(json!({
                        "error": {
                            "message": format!("BYOK upstream error: {err}"),
                            "type": "nodeai_byok_upstream",
                            "code": "upstream_error"
                        }
                    })),
                )
                    .into_response();
            }
        }
    }

    let model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("nodeai-mock");
    let created = std::time::SystemTime::now()
        .duration_since(std::time::UNIX_EPOCH)
        .map(|d| d.as_secs())
        .unwrap_or(0);

    let resp = (
        StatusCode::OK,
        Json(json!({
            "id": format!("chatcmpl-nodeai-{app_slug}"),
            "object": "chat.completion",
            "created": created,
            "model": model,
            "choices": [{
                "index": 0,
                "message": {
                    "role": "assistant",
                    "content": format!(
                        "[NodeAI BYOK skeleton] Received request for app \"{app_slug}\". Configure NODEAI_BYOK_UPSTREAM or AI_GATEWAY_API_KEY."
                    )
                },
                "finish_reason": "stop"
            }],
            "usage": {
                "prompt_tokens": 0,
                "completion_tokens": 0,
                "total_tokens": 0
            },
            "nodeai": {
                "path": "byok_local",
                "app": app_slug,
                "bonus": bonus,
            }
        })),
    )
        .into_response();
    attach_bonus_header(resp, &bonus)
}

async fn forward_byok_upstream(
    upstream: &str,
    headers: &HeaderMap,
    body: &Value,
    app_slug: &str,
) -> Result<Response<axum::body::Body>, String> {
    let base = upstream.trim_end_matches('/');
    let url = format!("{base}/v1/chat/completions");
    let client = reqwest::Client::new();
    let mut req = client.post(&url).json(body);

    if let Some(auth) = headers.get("authorization") {
        if let Ok(v) = auth.to_str() {
            req = req.header("Authorization", v);
        }
    }
    req = req.header("X-NodeAI-App", app_slug);

    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status =
        StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .body(axum::body::Body::from(bytes.to_vec()))
        .map_err(|e| e.to_string())
}

async fn not_implemented() -> impl IntoResponse {
    (
        StatusCode::NOT_IMPLEMENTED,
        Json(json!({
            "error": {
                "message": "Endpoint planned for a later MVP milestone.",
                "type": "not_implemented"
            }
        })),
    )
}

#[cfg(test)]
mod tests {
    use super::*;
    use nodeai_core::apply_bonus_pipeline;
    use serde_json::json;

    #[test]
    fn bonus_pipeline_on_rtk_payload() {
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "messages": [{
                "role": "user",
                "content": format!("tool_result: {}", "line\n".repeat(40))
            }]
        });
        let profile = CompressionProfile {
            caveman_level: 0,
            ..Default::default()
        };
        let result = apply_bonus_pipeline(&mut body, &profile, &[]);
        assert!(result.rtk_applied || result.rtk_tokens_saved > 0);
    }
}
