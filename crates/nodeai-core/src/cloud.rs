/// Optional NodeAI Cloud relay base (hosted quota billing path).
pub fn cloud_base_url_from_env() -> Option<String> {
    std::env::var("NODEAI_CLOUD_BASE_URL")
        .ok()
        .map(|s| s.trim().trim_end_matches('/').to_string())
        .filter(|s| !s.is_empty())
}

#[derive(Debug, Clone)]
pub struct CloudConfig {
    pub base_url: String,
}

impl CloudConfig {
    pub fn from_env() -> Option<Self> {
        cloud_base_url_from_env().map(|base_url| Self { base_url })
    }
}

pub fn is_valid_session_token(token: &str) -> bool {
    let t = token.trim();
    !t.is_empty() && (t.starts_with("nodeai_session_") || t.starts_with("nsk_"))
}
