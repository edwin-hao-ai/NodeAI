/// Default NodeAI Cloud API — local dev server (`nodeai-cloud-dev` on :8788).
/// Override with `NODEAI_CLOUD_BASE_URL` when staging/production exists.
pub const DEFAULT_CLOUD_BASE_URL: &str = "http://127.0.0.1:8788";

/// Resolve Cloud API base URL: env override → built-in localhost.
pub fn cloud_base_url_from_env() -> String {
    if let Some(url) = std::env::var("NODEAI_CLOUD_BASE_URL")
        .ok()
        .map(|s| s.trim().trim_end_matches('/').to_string())
        .filter(|s| !s.is_empty())
    {
        return url;
    }
    DEFAULT_CLOUD_BASE_URL.to_string()
}

pub fn cloud_is_dev_local(base_url: &str) -> bool {
    let u = base_url.to_lowercase();
    u.contains("127.0.0.1") || u.contains("localhost")
}

#[derive(Debug, Clone)]
pub struct CloudConfig {
    pub base_url: String,
}

impl CloudConfig {
    pub fn from_env() -> Self {
        Self {
            base_url: cloud_base_url_from_env(),
        }
    }

    pub fn dev_local(&self) -> bool {
        cloud_is_dev_local(&self.base_url)
    }
}

pub fn is_valid_session_token(token: &str) -> bool {
    let t = token.trim();
    !t.is_empty() && (t.starts_with("nodeai_session_") || t.starts_with("nsk_"))
}
