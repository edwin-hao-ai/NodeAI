use nodeai_core::{default_model_for_intent, CompressionProfile};
use serde_json::{json, Value};

pub fn apply_smart_route(body: &mut Value, intent: Option<&str>, profile: &CompressionProfile) {
    let _ = profile;
    let Some(intent) = intent.filter(|s| !s.is_empty() && *s != "auto") else {
        return;
    };
    let Some(model) = default_model_for_intent(intent) else {
        return;
    };
    if body.get("model").and_then(|m| m.as_str()) != Some(model) {
        tracing::info!(intent, %model, "smart route model override");
        body["model"] = json!(model);
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use serde_json::json;

    #[test]
    fn overrides_model_for_code_intent() {
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "messages": [{"role": "user", "content": "hi"}]
        });
        let profile = CompressionProfile::default();
        apply_smart_route(&mut body, Some("code"), &profile);
        assert_eq!(body["model"], "alibaba/qwen3-coder");
    }

    #[test]
    fn skips_auto_intent() {
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "messages": [{"role": "user", "content": "hi"}]
        });
        apply_smart_route(&mut body, Some("auto"), &CompressionProfile::default());
        assert_eq!(body["model"], "google/gemini-2.5-flash");
    }
}
