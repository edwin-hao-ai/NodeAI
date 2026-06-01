use axum::{
    extract::State,
    http::{HeaderMap, StatusCode},
    response::IntoResponse,
    routing::{get, post},
    Json, Router,
};
use nodeai_core::{ModelCatalogEntry, TrafficPath};
use serde_json::json;

use crate::auth::parse_nodeai_app_key;
use crate::ProxyState;

pub fn router() -> Router<ProxyState> {
    Router::new()
        .route("/health", get(health))
        .route("/v1/models", get(list_models))
        .route("/v1/chat/completions", post(chat_completions))
        .route("/v1/embeddings", post(not_implemented))
}

async fn health() -> impl IntoResponse {
    Json(json!({ "ok": true, "service": "nodeai-proxy" }))
}

async fn list_models(State(state): State<ProxyState>) -> Json<serde_json::Value> {
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

fn resolve_path(auth: Option<&str>) -> (TrafficPath, Option<String>) {
    if let Some(app) = parse_nodeai_app_key(auth) {
        (TrafficPath::ByokLocal, Some(app.app_slug))
    } else {
        (TrafficPath::HostedQuota, None)
    }
}

async fn chat_completions(
    State(state): State<ProxyState>,
    headers: HeaderMap,
    Json(body): Json<serde_json::Value>,
) -> impl IntoResponse {
    let auth = bearer_token(&headers);
    let (path, app_slug) = resolve_path(auth.as_deref());
    let model = body.get("model").and_then(|m| m.as_str()).unwrap_or("unknown");

    tracing::info!(
        ?path,
        ?app_slug,
        %model,
        "chat completion request"
    );

    match path {
        TrafficPath::HostedQuota => hosted_quota_unavailable(),
        TrafficPath::ByokLocal => {
            let slug = app_slug.unwrap_or_default();
            byok_chat_completions(&state, &headers, body, &slug).await
        }
    }
}

fn hosted_quota_unavailable() -> (StatusCode, Json<serde_json::Value>) {
    (
        StatusCode::SERVICE_UNAVAILABLE,
        Json(json!({
            "error": {
                "message": "Allowance path is not configured in this build. Connect with an app access code for on-device model sources.",
                "type": "nodeai_not_configured",
                "code": "cloud_api_pending"
            }
        })),
    )
}

async fn byok_chat_completions(
    state: &ProxyState,
    headers: &HeaderMap,
    body: serde_json::Value,
    app_slug: &str,
) -> (StatusCode, Json<serde_json::Value>) {
    if let Some(upstream) = state.config.byok_upstream_url.as_deref() {
        match forward_byok_upstream(upstream, headers, &body, app_slug).await {
            Ok(resp) => return resp,
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
                );
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

    (
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
                        "[NodeAI BYOK skeleton] Received request for app \"{app_slug}\". Configure NODEAI_BYOK_UPSTREAM to forward to your provider."
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
                "app": app_slug
            }
        })),
    )
}

async fn forward_byok_upstream(
    upstream: &str,
    headers: &HeaderMap,
    body: &serde_json::Value,
    app_slug: &str,
) -> Result<(StatusCode, Json<serde_json::Value>), String> {
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

    let resp = req
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status =
        StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    let value: serde_json::Value =
        serde_json::from_slice(&bytes).unwrap_or(json!({ "raw": String::from_utf8_lossy(&bytes) }));
    Ok((status, Json(value)))
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
