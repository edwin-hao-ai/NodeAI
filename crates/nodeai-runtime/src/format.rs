use serde_json::{json, Value};

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum ApiFormat {
    OpenAi,
    Anthropic,
    Gemini,
}

impl ApiFormat {
    pub fn from_label(label: &str) -> Self {
        match label.trim().to_lowercase().as_str() {
            "anthropic" | "claude" => Self::Anthropic,
            "gemini" | "google" => Self::Gemini,
            _ => Self::OpenAi,
        }
    }
}

/// Normalize an incoming OpenAI-compatible chat body for the target upstream format.
pub fn convert_chat_request(body: &Value, target: ApiFormat) -> Value {
    match target {
        ApiFormat::OpenAi => body.clone(),
        ApiFormat::Anthropic => openai_to_anthropic_messages(body),
        ApiFormat::Gemini => openai_to_gemini_contents(body),
    }
}

/// Normalize upstream response chunks to OpenAI chat.completion shape for the desktop edge.
pub fn convert_chat_response(body: &Value, source: ApiFormat) -> Value {
    match source {
        ApiFormat::OpenAi => body.clone(),
        ApiFormat::Anthropic => anthropic_to_openai_message(body),
        ApiFormat::Gemini => gemini_to_openai_message(body),
    }
}

fn openai_to_anthropic_messages(body: &Value) -> Value {
    let model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("claude-3-5-sonnet-latest");
    let messages = body
        .get("messages")
        .and_then(|m| m.as_array())
        .cloned()
        .unwrap_or_default();
    let mut system = Vec::new();
    let mut converted = Vec::new();
    for msg in messages {
        let role = msg.get("role").and_then(|r| r.as_str()).unwrap_or("user");
        let content = msg.get("content").cloned().unwrap_or(json!(""));
        if role == "system" {
            if let Some(text) = content.as_str() {
                system.push(text.to_string());
            }
            continue;
        }
        converted.push(json!({
            "role": if role == "assistant" { "assistant" } else { "user" },
            "content": content,
        }));
    }
    let mut out = json!({
        "model": model,
        "messages": converted,
        "max_tokens": body.get("max_tokens").cloned().unwrap_or(json!(4096)),
    });
    if !system.is_empty() {
        out["system"] = json!(system.join("\n\n"));
    }
    out
}

fn openai_to_gemini_contents(body: &Value) -> Value {
    let model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("gemini-2.5-flash");
    let messages = body
        .get("messages")
        .and_then(|m| m.as_array())
        .cloned()
        .unwrap_or_default();
    let contents: Vec<Value> = messages
        .iter()
        .filter_map(|msg| {
            let role = msg.get("role").and_then(|r| r.as_str()).unwrap_or("user");
            if role == "system" {
                return None;
            }
            Some(json!({
                "role": if role == "assistant" { "model" } else { "user" },
                "parts": [{ "text": msg.get("content").cloned().unwrap_or(json!("")) }],
            }))
        })
        .collect();
    json!({
        "model": model,
        "contents": contents,
    })
}

fn anthropic_to_openai_message(body: &Value) -> Value {
    let text = body
        .get("content")
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.first())
        .and_then(|b| b.get("text"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    json!({
        "choices": [{
            "message": { "role": "assistant", "content": text },
            "finish_reason": "stop"
        }]
    })
}

fn gemini_to_openai_message(body: &Value) -> Value {
    let text = body
        .get("candidates")
        .and_then(|c| c.as_array())
        .and_then(|arr| arr.first())
        .and_then(|c| c.get("content"))
        .and_then(|content| content.get("parts"))
        .and_then(|parts| parts.as_array())
        .and_then(|arr| arr.first())
        .and_then(|p| p.get("text"))
        .and_then(|t| t.as_str())
        .unwrap_or("");
    json!({
        "choices": [{
            "message": { "role": "assistant", "content": text },
            "finish_reason": "stop"
        }]
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn converts_openai_to_anthropic() {
        let body = json!({
            "model": "nodeai-chat",
            "messages": [
                { "role": "system", "content": "be concise" },
                { "role": "user", "content": "hi" }
            ]
        });
        let out = convert_chat_request(&body, ApiFormat::Anthropic);
        assert_eq!(out["system"], "be concise");
        assert_eq!(out["messages"].as_array().unwrap().len(), 1);
    }
}
