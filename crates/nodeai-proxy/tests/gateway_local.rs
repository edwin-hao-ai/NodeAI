//! Local integration tests — no live Gateway key required (wiremock).

use axum::body::to_bytes;
use nodeai_core::GatewayConfig;
use nodeai_proxy::gateway::{self, DEFAULT_FAILOVER_MODEL};
use serde_json::json;
use wiremock::matchers::{method, path};
use wiremock::{Mock, MockServer, ResponseTemplate};

fn test_gateway(base: &str) -> GatewayConfig {
    GatewayConfig {
        base_url: format!("{}/v1", base.trim_end_matches('/')),
        api_key: "mock-gateway-key".into(),
    }
}

#[tokio::test]
async fn chat_failover_retries_on_429() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/v1/chat/completions"))
        .respond_with(ResponseTemplate::new(429).set_body_json(json!({
            "error": { "message": "rate limited" }
        })))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    Mock::given(method("POST"))
        .and(path("/v1/chat/completions"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "choices": [{ "message": { "content": "ok-after-failover", "role": "assistant" } }]
        })))
        .mount(&server)
        .await;

    let gw = test_gateway(&server.uri());
    let body = json!({
        "model": "anthropic/claude-sonnet-4.6",
        "messages": [{ "role": "user", "content": "hi" }]
    });

    let resp = gateway::chat_completions(&gw, &body, Some("chat"), true)
        .await
        .expect("chat");
    assert!(resp.status().is_success());
    assert_eq!(
        resp.headers().get("x-nodeai-failover").and_then(|v| v.to_str().ok()),
        Some("1")
    );
    let bytes = to_bytes(resp.into_body(), usize::MAX).await.expect("body");
    let value: serde_json::Value = serde_json::from_slice(&bytes).expect("json");
    assert_eq!(
        value["choices"][0]["message"]["content"].as_str(),
        Some("ok-after-failover")
    );
}

#[tokio::test]
async fn chat_failover_uses_default_model() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/v1/chat/completions"))
        .respond_with(ResponseTemplate::new(503))
        .up_to_n_times(1)
        .mount(&server)
        .await;

    Mock::given(method("POST"))
        .and(path("/v1/chat/completions"))
        .respond_with(
            ResponseTemplate::new(200).set_body_json(json!({
                "model": DEFAULT_FAILOVER_MODEL,
                "choices": [{ "message": { "content": "fallback", "role": "assistant" } }]
            })),
        )
        .mount(&server)
        .await;

    let gw = test_gateway(&server.uri());
    let body = json!({
        "model": "openai/o1",
        "messages": [{ "role": "user", "content": "ping" }]
    });
    let resp = gateway::chat_completions(&gw, &body, None, true)
        .await
        .expect("chat");
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn embeddings_forwarding() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/v1/embeddings"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "data": [{ "embedding": [0.1, 0.2], "index": 0 }],
            "model": "google/gemini-embedding-001"
        })))
        .mount(&server)
        .await;

    let gw = test_gateway(&server.uri());
    let body = json!({
        "model": "google/gemini-embedding-001",
        "input": "hello"
    });
    let resp = gateway::embeddings(&gw, &body).await.expect("embeddings");
    assert!(resp.status().is_success());
}

#[tokio::test]
async fn byok_forwards_with_env_key() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/v1/chat/completions"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "choices": [{ "message": { "content": "byok-ok", "role": "assistant" } }]
        })))
        .mount(&server)
        .await;

    std::env::set_var("NODEAI_BYOK_KEY_SRC_LOCAL", "sk-local-test");
    let source = nodeai_core::ByokSourceRecord {
        id: "src-local".into(),
        name: "Local".into(),
        url: format!("{}/v1", server.uri()),
        format: "openai".into(),
        has_key: true,
    };
    let body = json!({
        "model": "gpt-4o-mini",
        "messages": [{ "role": "user", "content": "hi" }]
    });
    let resp = nodeai_proxy::byok::forward_chat(
        &source,
        &axum::http::HeaderMap::new(),
        &body,
        "chat",
        true,
    )
    .await
    .expect("byok forward");
    assert!(resp.status().is_success());
    std::env::remove_var("NODEAI_BYOK_KEY_SRC_LOCAL");
}

#[tokio::test]
async fn byok_converts_anthropic_response() {
    let server = MockServer::start().await;
    Mock::given(method("POST"))
        .and(path("/v1/messages"))
        .respond_with(ResponseTemplate::new(200).set_body_json(json!({
            "content": [{ "type": "text", "text": "anthropic-ok" }]
        })))
        .mount(&server)
        .await;

    std::env::set_var("NODEAI_BYOK_KEY_SRC_ANTH", "sk-ant-test");
    let source = nodeai_core::ByokSourceRecord {
        id: "src-anth".into(),
        name: "Anthropic".into(),
        url: format!("{}/v1", server.uri()),
        format: "anthropic".into(),
        has_key: true,
    };
    let body = json!({
        "model": "claude-sonnet-4",
        "messages": [
            { "role": "system", "content": "be concise" },
            { "role": "user", "content": "hi" }
        ]
    });
    let resp = nodeai_proxy::byok::forward_chat(
        &source,
        &axum::http::HeaderMap::new(),
        &body,
        "chat",
        true,
    )
    .await
    .expect("anthropic byok");
    assert!(resp.status().is_success());
    let bytes = axum::body::to_bytes(resp.into_body(), usize::MAX)
        .await
        .expect("body");
    let value: serde_json::Value = serde_json::from_slice(&bytes).expect("json");
    assert_eq!(
        value["choices"][0]["message"]["content"].as_str(),
        Some("anthropic-ok")
    );
    std::env::remove_var("NODEAI_BYOK_KEY_SRC_ANTH");
}

#[test]
fn cloud_relay_requires_valid_session() {
    assert!(nodeai_core::is_valid_session_token("nodeai_session_demo"));
    assert!(!nodeai_core::is_valid_session_token(""));
    assert!(nodeai_proxy::cloud::require_session(Some("nodeai_session_x")).is_ok());
    assert!(nodeai_proxy::cloud::require_session(None).is_err());
}
