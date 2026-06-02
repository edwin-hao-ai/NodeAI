use nodeai_core::{apply_bonus_pipeline, apply_context_trim, apply_input_bonus, plan_context_trim, CompressionProfile};
use serde_json::Value;

#[derive(Clone)]
pub struct BonusState {
    profile: std::sync::Arc<std::sync::Mutex<CompressionProfile>>,
}

impl Default for BonusState {
    fn default() -> Self {
        Self {
            profile: std::sync::Arc::new(std::sync::Mutex::new(CompressionProfile::default())),
        }
    }
}

impl BonusState {
    pub fn get_profile(&self) -> CompressionProfile {
        self.profile.lock().expect("bonus lock").clone()
    }

    pub fn set_profile(&self, profile: CompressionProfile) {
        *self.profile.lock().expect("bonus lock") = profile;
    }

    pub fn transform_body(
        &self,
        body: &mut Value,
        memories: &[String],
        context_window: u64,
    ) -> nodeai_core::BonusApplyResult {
        let profile = self.get_profile();
        apply_bonus_pipeline(body, &profile, memories, context_window)
    }

    pub fn transform_body_with_llm_prune(
        &self,
        body: &mut Value,
        memories: &[String],
        context_window: u64,
        llm_summary: Option<&str>,
    ) -> nodeai_core::BonusApplyResult {
        let profile = self.get_profile();
        let mut result = apply_input_bonus(body, &profile, memories);
        let max_tokens = body
            .get("max_tokens")
            .and_then(|v| v.as_u64())
            .unwrap_or(1024);
        if let Some(messages) = body.get_mut("messages").and_then(|m| m.as_array_mut()) {
            if let Some(plan) = plan_context_trim(messages, context_window, max_tokens) {
                apply_context_trim(messages, &plan, &profile, llm_summary, &mut result);
            }
        }
        result
    }
}

pub fn parse_memory_header(raw: Option<&str>) -> Vec<String> {
    let Some(raw) = raw else {
        return Vec::new();
    };
    if let Ok(list) = serde_json::from_str::<Vec<String>>(raw) {
        return list.into_iter().filter(|s| !s.trim().is_empty()).collect();
    }
    if raw.trim().is_empty() {
        Vec::new()
    } else {
        vec![raw.trim().to_string()]
    }
}
