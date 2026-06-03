use axum::body::Body;
use axum::http::{HeaderMap, Response, StatusCode};
use nodeai_core::SourcesFile;
use nodeai_runtime::{convert_chat_request, convert_chat_response, ApiFormat};
use reqwest::Client;
use serde_json::{json, Value};

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

pub fn resolve_chat_url(base: &str, format: ApiFormat) -> String {
    let base = base.trim().trim_end_matches('/');
    match format {
        ApiFormat::OpenAi => {
            if base.ends_with("/chat/completions") {
                base.to_string()
            } else if base.ends_with("/v1") {
                format!("{base}/chat/completions")
            } else {
                format!("{base}/v1/chat/completions")
            }
        }
        ApiFormat::Anthropic => {
            if base.ends_with("/messages") {
                base.to_string()
            } else if base.ends_with("/v1") {
                format!("{base}/messages")
            } else {
                format!("{base}/v1/messages")
            }
        }
        ApiFormat::Gemini => {
            if base.contains("generativelanguage.googleapis.com") {
                format!("{base}/v1beta/openai/chat/completions")
            } else if base.ends_with("/chat/completions") {
                base.to_string()
            } else if base.ends_with("/v1") {
                format!("{base}/chat/completions")
            } else {
                format!("{base}/v1/chat/completions")
            }
        }
    }
}

pub async fn forward_chat(
    source: &nodeai_core::ByokSourceRecord,
    headers: &HeaderMap,
    body: &Value,
    app_slug: &str,
    format_translate: bool,
) -> Result<Response<Body>, String> {
    let api_key = api_key_for_source(&source.id)?;
    let format = ApiFormat::from_label(&source.format);
    let url = resolve_chat_url(&source.url, format);
    let payload = if format_translate {
        convert_chat_request(body, format)
    } else {
        body.clone()
    };

    let client = Client::new();
    let mut req = client.post(&url).json(&payload);

    if format == ApiFormat::Anthropic {
        req = req.header("x-api-key", &api_key).header("anthropic-version", "2023-06-01");
    } else {
        req = req.bearer_auth(&api_key);
    }

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

    let body_bytes = if !format_translate || format == ApiFormat::OpenAi {
        bytes.to_vec()
    } else {
        let value: Value = serde_json::from_slice(&bytes).unwrap_or(json!({}));
        let converted = convert_chat_response(&value, format);
        serde_json::to_vec(&converted).unwrap_or_else(|_| bytes.to_vec())
    };

    Response::builder()
        .status(status)
        .header("content-type", "application/json")
        .header("x-nodeai-path", "byok_local")
        .header("x-nodeai-source-format", &source.format)
        .body(Body::from(body_bytes))
        .map_err(|e| e.to_string())
}

pub fn resolve_source<'a>(
    sources: &'a SourcesFile,
    source_id: Option<&str>,
) -> Option<&'a nodeai_core::ByokSourceRecord> {
    sources.resolve(source_id).filter(|s| s.has_key)
}

pub fn hybrid_fallback_ready(headers: &HeaderMap) -> bool {
    header_flag(headers, "x-nodeai-hybrid-fallback")
        && header_flag(headers, "x-nodeai-hybrid-fallback-confirm")
}

fn header_flag(headers: &HeaderMap, name: &str) -> bool {
    headers
        .get(name)
        .and_then(|v| v.to_str().ok())
        .is_some_and(|v| v == "1" || v.eq_ignore_ascii_case("true"))
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

    #[test]
    fn resolves_openai_and_anthropic_urls() {
        assert!(resolve_chat_url("https://api.openai.com/v1", ApiFormat::OpenAi).contains("chat/completions"));
        assert!(resolve_chat_url("https://api.anthropic.com", ApiFormat::Anthropic).contains("messages"));
    }

    #[test]
    fn hybrid_requires_both_headers() {
        let mut headers = HeaderMap::new();
        assert!(!hybrid_fallback_ready(&headers));
        headers.insert("x-nodeai-hybrid-fallback", "1".parse().unwrap());
        assert!(!hybrid_fallback_ready(&headers));
        headers.insert("x-nodeai-hybrid-fallback-confirm", "1".parse().unwrap());
        assert!(hybrid_fallback_ready(&headers));
    }
}
