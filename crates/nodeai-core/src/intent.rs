/// Scene → default Gateway model slug (aligned with `demo.ts` INTENTS).
pub fn default_model_for_intent(intent: &str) -> Option<&'static str> {
    match intent {
        "code" => Some("alibaba/qwen3-coder"),
        "learn" => Some("google/gemini-2.5-flash"),
        "write" => Some("anthropic/claude-sonnet-4.6"),
        "chat" => Some("google/gemini-2.5-flash"),
        "image" => Some("bfl/flux-2-pro"),
        "video" => Some("alibaba/wan-v2.6-t2v"),
        "research" => Some("google/gemini-2.5-pro"),
        "embed" => Some("google/gemini-embedding-001"),
        _ => None,
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn maps_code_intent() {
        assert_eq!(
            default_model_for_intent("code"),
            Some("alibaba/qwen3-coder")
        );
    }
}
