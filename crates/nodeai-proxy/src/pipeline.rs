use nodeai_core::{apply_bonus_pipeline, CompressionProfile};
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
