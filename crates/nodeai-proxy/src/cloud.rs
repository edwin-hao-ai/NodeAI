use axum::body::Body;
use axum::http::{Response, StatusCode};
use nodeai_core::{is_valid_session_token, CloudConfig, GatewayConfig};
use reqwest::Client;
use serde_json::Value;

use crate::gateway::{self, DEFAULT_FAILOVER_MODEL};

pub fn require_session(session: Option<&str>) -> Result<&str, String> {
    let token = session.ok_or_else(|| "missing X-NodeAI-Cloud-Token".to_string())?;
    if is_valid_session_token(token) {
        Ok(token.trim())
    } else {
        Err("invalid cloud session token".into())
    }
}

pub async fn chat_completions(
    cloud: &CloudConfig,
    gateway: &GatewayConfig,
    session: &str,
    body: &Value,
    app_slug: Option<&str>,
    failover_enabled: bool,
) -> Result<Response<Body>, String> {
    let url = format!("{}/v1/chat/completions", cloud.base_url.trim_end_matches('/'));
    let client = Client::new();
    let mut req = client
        .post(&url)
        .bearer_auth(session)
        .header("Content-Type", "application/json")
        .header("X-NodeAI-Gateway-Key", &gateway.api_key)
        .json(body);

    if let Some(app) = app_slug {
        req = req.header("X-NodeAI-App", app);
    }

    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status =
        StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);

    if status.is_success() || !failover_enabled || !gateway::is_failover_status(status) {
        let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
        let mut builder = Response::builder()
            .status(status)
            .header("content-type", "application/json")
            .header("x-nodeai-path", "cloud_quota");
        if status.is_success() {
            builder = builder.header("x-nodeai-cloud", "1");
        }
        return builder
            .body(Body::from(bytes.to_vec()))
            .map_err(|e| e.to_string());
    }

    tracing::warn!(status = %status, "cloud relay failover to gateway");
    gateway::chat_completions(gateway, body, app_slug, true).await
}

/// Local dev mock cloud: accepts session and proxies straight to gateway.
pub async fn mock_relay_to_gateway(
    gateway: &GatewayConfig,
    session: &str,
    body: &Value,
    app_slug: Option<&str>,
    failover_enabled: bool,
) -> Result<Response<Body>, String> {
    let _ = session;
    let resp = gateway::chat_completions(gateway, body, app_slug, failover_enabled).await?;
    let (mut parts, body) = resp.into_parts();
    parts.headers.insert("x-nodeai-cloud", "1".parse().unwrap());
    parts.headers.insert("x-nodeai-path", "cloud_quota".parse().unwrap());
    Ok(Response::from_parts(parts, body))
}

pub fn fallback_model_note() -> &'static str {
    DEFAULT_FAILOVER_MODEL
}
