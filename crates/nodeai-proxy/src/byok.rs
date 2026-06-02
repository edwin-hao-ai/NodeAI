use axum::body::Body;
use axum::http::{HeaderMap, Response, StatusCode};
use nodeai_core::SourcesFile;
use reqwest::Client;
use serde_json::Value;

pub const KEYCHAIN_SERVICE: &str = "nodeai-desktop";

pub fn api_key_for_source(source_id: &str) -> Result<String, String> {
    let env_key = format!("NODEAI_BYOK_KEY_{}", source_id.replace('-', "_").to_uppercase());
    if let Ok(key) = std::env::var(&env_key) {
        let trimmed = key.trim();
        if !trimmed.is_empty() {
            return Ok(trimmed.to_string());
        }
    }
    keyring::Entry::new(KEYCHAIN_SERVICE, source_id)
        .map_err(|e| format!("keychain: {e}"))?
        .get_password()
        .map_err(|e| format!("keychain: {e}"))
}

pub async fn forward_chat(
    source: &nodeai_core::ByokSourceRecord,
    headers: &HeaderMap,
    body: &Value,
    app_slug: &str,
) -> Result<Response<Body>, String> {
    let api_key = api_key_for_source(&source.id)?;
    let base = source.url.trim().trim_end_matches('/');
    let url = format!("{base}/chat/completions");
    let client = Client::new();
    let mut req = client.post(&url).bearer_auth(&api_key).json(body);

    if let Some(auth) = headers.get("authorization") {
        if let Ok(v) = auth.to_str() {
            req = req.header("X-NodeAI-Original-Authorization", v);
        }
    }
    req = req.header("X-NodeAI-App", app_slug);
    req = req.header("X-NodeAI-Source-Format", &source.format);

    let resp = req.send().await.map_err(|e| e.to_string())?;
    let status =
        StatusCode::from_u16(resp.status().as_u16()).unwrap_or(StatusCode::BAD_GATEWAY);
    let bytes = resp.bytes().await.map_err(|e| e.to_string())?;
    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .header("x-nodeai-path", "byok_local")
        .body(Body::from(bytes.to_vec()))
        .map_err(|e| e.to_string())
}

pub fn resolve_source<'a>(
    sources: &'a SourcesFile,
    source_id: Option<&str>,
) -> Option<&'a nodeai_core::ByokSourceRecord> {
    sources.resolve(source_id).filter(|s| s.has_key)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_api_key_from_env_override() {
        std::env::set_var("NODEAI_BYOK_KEY_SRC_TEST", "sk-test-key");
        let key = api_key_for_source("src-test").expect("env key");
        assert_eq!(key, "sk-test-key");
        std::env::remove_var("NODEAI_BYOK_KEY_SRC_TEST");
    }
}
