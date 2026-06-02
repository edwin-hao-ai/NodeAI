use axum::http::HeaderMap;
use nodeai_core::{build_prune_transcript, CloudConfig};
use serde_json::{json, Value};

use crate::ProxyState;

const PRUNE_MODEL: &str = "google/gemini-2.5-flash";

fn parse_chat_content(bytes: &[u8]) -> Option<String> {
    let value: Value = serde_json::from_slice(bytes).ok()?;
    value
        .get("choices")?
        .as_array()?
        .first()?
        .get("message")?
        .get("content")?
        .as_str()
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
}

/// Summarize dropped chat history via Cloud relay (cheap model). Falls back to None on error.
pub async fn llm_summarize_prune(
    state: &ProxyState,
    headers: &HeaderMap,
    dropped: &[Value],
) -> Option<String> {
    if !state.cloud.dev_local() && !nodeai_core::cloud_api_reachable(&state.cloud.base_url) {
        return None;
    }

    let session = headers
        .get("x-nodeai-cloud-token")
        .and_then(|v| v.to_str().ok())
        .filter(|t| nodeai_core::is_valid_session_token(t))?;

    let transcript = build_prune_transcript(dropped);
    if transcript.len() < 120 {
        return None;
    }

    let body = json!({
        "model": PRUNE_MODEL,
        "messages": [
            {
                "role": "system",
                "content": "Summarize the conversation excerpt for continuing chat. Preserve user goals, decisions, names, file paths, and constraints. Use concise bullet points in the same language as the excerpt."
            },
            { "role": "user", "content": transcript }
        ],
        "max_tokens": 900,
        "stream": false
    });

    summarize_via_cloud(&state.cloud, session, &body).await
}

async fn summarize_via_cloud(cloud: &CloudConfig, session: &str, body: &Value) -> Option<String> {
    let resp = nodeai_cloud::relay_chat(cloud, session, body, Some("prune"))
        .await
        .ok()?;
    if !resp.status().is_success() {
        tracing::warn!(status = %resp.status(), "prune llm summarize failed");
        return None;
    }
    let bytes = resp.bytes().await.ok()?;
    parse_chat_content(&bytes)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_openai_chat_json() {
        let raw = br#"{"choices":[{"message":{"content":"- user asked about README"}}]}"#;
        assert_eq!(
            parse_chat_content(raw).as_deref(),
            Some("- user asked about README")
        );
    }
}
