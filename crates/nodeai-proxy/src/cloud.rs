use axum::body::Body;
use axum::http::{header, Response, StatusCode};
use futures_util::StreamExt;
use nodeai_core::{is_valid_session_token, CloudConfig};
use reqwest::Response as ReqwestResponse;
use serde_json::{json, Value};

use crate::gateway::{self, DEFAULT_FAILOVER_MODEL};

pub fn require_session(session: Option<&str>) -> Result<&str, String> {
    let token = session.ok_or_else(|| "missing X-NodeAI-Cloud-Token".to_string())?;
    if is_valid_session_token(token) {
        Ok(token.trim())
    } else {
        Err("invalid cloud session token".into())
    }
}

pub async fn relay_upstream(resp: ReqwestResponse) -> Result<Response<Body>, String> {
    let status =
        StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let content_type = resp
        .headers()
        .get(header::CONTENT_TYPE)
        .and_then(|v| v.to_str().ok())
        .unwrap_or("application/json")
        .to_string();

    if content_type.contains("text/event-stream") {
        let builder = Response::builder()
            .status(status)
            .header(header::CONTENT_TYPE, content_type)
            .header("x-nodeai-cloud", "1")
            .header("x-nodeai-path", "cloud_quota");
        let stream = resp.bytes_stream().map(|result| {
            result.map_err(|err| std::io::Error::new(std::io::ErrorKind::Other, err.to_string()))
        });
        return builder
            .body(Body::from_stream(stream))
            .map_err(|e| e.to_string());
    }

    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    Response::builder()
        .status(status)
        .header(header::CONTENT_TYPE, content_type)
        .header("x-nodeai-cloud", "1")
        .header("x-nodeai-path", "cloud_quota")
        .body(Body::from(bytes.to_vec()))
        .map_err(|e| e.to_string())
}

pub async fn chat_completions(
    cloud: &CloudConfig,
    session: &str,
    body: &Value,
    app_slug: Option<&str>,
    failover_enabled: bool,
) -> Result<Response<Body>, String> {
    let original_model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("")
        .to_string();

    let resp = nodeai_cloud::relay_chat(cloud, session, body, app_slug).await?;
    let status = resp.status();

    if failover_enabled
        && gateway::is_failover_status(
            StatusCode::from_u16(status.as_u16()).unwrap_or(StatusCode::BAD_GATEWAY),
        )
        && original_model != DEFAULT_FAILOVER_MODEL
    {
        tracing::warn!(
            status = %status,
            %original_model,
            fallback = DEFAULT_FAILOVER_MODEL,
            "cloud relay failover retry"
        );
        let mut retry_body = body.clone();
        retry_body["model"] = json!(DEFAULT_FAILOVER_MODEL);
        let retry = nodeai_cloud::relay_chat(cloud, session, &retry_body, app_slug).await?;
        let out = relay_upstream(retry).await?;
        let (mut parts, body) = out.into_parts();
        parts
            .headers
            .insert("x-nodeai-failover", "1".parse().unwrap());
        return Ok(Response::from_parts(parts, body));
    }

    relay_upstream(resp).await
}

pub async fn embeddings(
    cloud: &CloudConfig,
    session: &str,
    body: &Value,
) -> Result<Response<Body>, String> {
    let resp = nodeai_cloud::relay_embeddings(cloud, session, body).await?;
    relay_upstream(resp).await
}
