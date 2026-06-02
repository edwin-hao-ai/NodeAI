use serde_json::{json, Value};

/// Map NodeAI virtual aliases (Cursor-facing) → Gateway slugs before upstream.
pub fn resolve_virtual_model_id(model: &str, intent: Option<&str>, smart_route: bool) -> String {
    if !model.starts_with("nodeai-") {
        return model.to_string();
    }
    if model == "nodeai-auto" {
        if smart_route {
            if let Some(intent) = intent.filter(|s| !s.is_empty() && *s != "auto") {
                if let Some(m) = crate::default_model_for_intent(intent) {
                    return m.to_string();
                }
            }
        }
        return "google/gemini-2.5-flash".into();
    }
    match model {
        "nodeai-chat" => "google/gemini-2.5-flash".into(),
        "nodeai-code" => "alibaba/qwen3-coder".into(),
        "nodeai-fast" => "google/gemini-2.5-flash".into(),
        "nodeai-smart" => "google/gemini-2.5-pro".into(),
        other => other.to_string(),
    }
}

pub fn resolve_request_model(body: &mut Value, intent: Option<&str>, smart_route: bool) {
    let Some(model) = body.get("model").and_then(|m| m.as_str()) else {
        return;
    };
    let resolved = resolve_virtual_model_id(model, intent, smart_route);
    if resolved != model {
        body["model"] = json!(resolved);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn resolves_nodeai_auto_with_intent() {
        let mut body = json!({ "model": "nodeai-auto" });
        resolve_request_model(&mut body, Some("code"), true);
        assert_eq!(body["model"], "alibaba/qwen3-coder");
    }

    #[test]
    fn passes_through_gateway_slug() {
        assert_eq!(
            resolve_virtual_model_id("anthropic/claude-opus-4.8", None, false),
            "anthropic/claude-opus-4.8"
        );
    }
}
