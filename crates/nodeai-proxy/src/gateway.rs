use axum::body::Body;
use axum::http::{header, Response, StatusCode};
use futures_util::StreamExt;
use nodeai_core::{GatewayConfig, ModelCatalogEntry};
use reqwest::Client;
use serde_json::{json, Value};

pub const DEFAULT_FAILOVER_MODEL: &str = "google/gemini-2.5-flash";

pub fn is_failover_status(status: StatusCode) -> bool {
    matches!(status.as_u16(), 429 | 503)
}

pub async fn fetch_models(gw: &GatewayConfig) -> Result<Vec<ModelCatalogEntry>, String> {
    let url = format!("{}/models", gw.base_url.trim_end_matches('/'));
    let client = Client::new();
    let resp = client
        .get(&url)
        .bearer_auth(&gw.api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("gateway models {status}: {body}"));
    }

    let payload: Value = resp.json().await.map_err(|e| e.to_string())?;
    let Some(data) = payload.get("data").and_then(|d| d.as_array()) else {
        return Err("gateway models: missing data array".into());
    };

    let models: Vec<ModelCatalogEntry> = data
        .iter()
        .filter_map(|m| serde_json::from_value(m.clone()).ok())
        .collect();

    if models.is_empty() {
        return Err("gateway models: empty catalog".into());
    }
    Ok(models)
}

async fn forward_json_post(
    gw: &GatewayConfig,
    path: &str,
    body: &Value,
    app_slug: Option<&str>,
) -> Result<Response<Body>, String> {
    let url = format!("{}/{}", gw.base_url.trim_end_matches('/'), path);
    let client = Client::new();
    let mut req = client
        .post(&url)
        .bearer_auth(&gw.api_key)
        .header("Content-Type", "application/json")
        .json(body);

    if let Some(app) = app_slug {
        req = req.header("X-NodeAI-App", app);
    }

    let streaming = body.get("stream").and_then(|v| v.as_bool()) == Some(true);
    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status =
        StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);

    if streaming {
        let mut builder = Response::builder().status(status);
        if let Some(ct) = resp.headers().get(header::CONTENT_TYPE) {
            if let Ok(v) = ct.to_str() {
                builder = builder.header(header::CONTENT_TYPE, v);
            }
        } else {
            builder = builder.header(header::CONTENT_TYPE, "text/event-stream");
        }
        let stream = resp.bytes_stream().map(|result| {
            result.map_err(|err| std::io::Error::new(std::io::ErrorKind::Other, err.to_string()))
        });
        return builder
            .body(Body::from_stream(stream))
            .map_err(|e| e.to_string());
    }

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    let value: Value =
        serde_json::from_slice(&bytes).unwrap_or(json!({ "raw": String::from_utf8_lossy(&bytes) }));

    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, "application/json")
        .body(Body::from(serde_json::to_vec(&value).unwrap_or_default()))
        .map_err(|e| e.to_string())
}

fn with_failover_header(resp: Response<Body>, failovered: bool) -> Response<Body> {
    if !failovered {
        return resp;
    }
    let (mut parts, body) = resp.into_parts();
    parts
        .headers
        .insert("x-nodeai-failover", "1".parse().unwrap_or_else(|_| "1".parse().unwrap()));
    Response::from_parts(parts, body)
}

pub async fn chat_completions(
    gw: &GatewayConfig,
    body: &Value,
    app_slug: Option<&str>,
    failover_enabled: bool,
) -> Result<Response<Body>, String> {
    let original_model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("")
        .to_string();

    let resp = forward_json_post(gw, "chat/completions", body, app_slug).await?;
    let status = resp.status();

    if failover_enabled
        && is_failover_status(status)
        && original_model != DEFAULT_FAILOVER_MODEL
    {
        tracing::warn!(
            status = %status,
            %original_model,
            fallback = DEFAULT_FAILOVER_MODEL,
            "gateway failover retry"
        );
        let mut retry_body = body.clone();
        retry_body["model"] = json!(DEFAULT_FAILOVER_MODEL);
        let retry = forward_json_post(gw, "chat/completions", &retry_body, app_slug).await?;
        return Ok(with_failover_header(retry, true));
    }

    Ok(with_failover_header(resp, false))
}

pub async fn embeddings(gw: &GatewayConfig, body: &Value) -> Result<Response<Body>, String> {
    forward_json_post(gw, "embeddings", body, None).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use nodeai_core::load_dotenv;

    #[test]
    fn detects_failover_status_codes() {
        assert!(is_failover_status(StatusCode::TOO_MANY_REQUESTS));
        assert!(is_failover_status(StatusCode::SERVICE_UNAVAILABLE));
        assert!(!is_failover_status(StatusCode::OK));
    }

    #[tokio::test]
    #[ignore = "requires AI_GATEWAY_API_KEY in .env"]
    async fn live_fetch_models() {
        load_dotenv();
        let gw = GatewayConfig::from_env().expect("AI_GATEWAY_API_KEY");
        let models = fetch_models(&gw).await.expect("fetch models");
        assert!(models.len() > 10);
        assert!(models.iter().any(|m| m.id.contains('/')));
    }

    #[tokio::test]
    #[ignore = "requires AI_GATEWAY_API_KEY in .env"]
    async fn live_chat_completion() {
        load_dotenv();
        let gw = GatewayConfig::from_env().expect("AI_GATEWAY_API_KEY");
        let models = fetch_models(&gw).await.expect("fetch models");
        let model = models
            .iter()
            .find(|m| m.id.contains("gemini") || m.id.contains("gpt"))
            .map(|m| m.id.as_str())
            .unwrap_or(DEFAULT_FAILOVER_MODEL);

        let body = json!({
            "model": model,
            "messages": [{"role": "user", "content": "Reply with exactly: ok"}],
            "max_tokens": 16
        });
        let resp = chat_completions(&gw, &body, Some("chat"), false)
            .await
            .expect("chat");
        assert!(resp.status().is_success());
        let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
            .await
            .expect("body");
        let value: Value = serde_json::from_slice(&bytes).expect("json");
        let content = value["choices"][0]["message"]["content"]
            .as_str()
            .unwrap_or("");
        assert!(!content.is_empty());
    }
}
