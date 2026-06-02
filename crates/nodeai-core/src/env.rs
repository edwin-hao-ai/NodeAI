use std::path::Path;

const PLACEHOLDER_KEY: &str = "your_vercel_ai_gateway_key_here";

/// Load repo `.env` when running from Tauri or `cargo` without exported vars.
pub fn load_dotenv() {
    if gateway_api_key_from_env().is_some() {
        return;
    }
    let _ = dotenvy::dotenv();
    if gateway_api_key_from_env().is_some() {
        return;
    }
    for rel in ["../../.env", "../../../.env", "../../../../.env"] {
        if let Ok(manifest) = std::env::var("CARGO_MANIFEST_DIR") {
            let path = Path::new(&manifest).join(rel);
            if path.exists() {
                let _ = dotenvy::from_path(path);
                if gateway_api_key_from_env().is_some() {
                    return;
                }
            }
        }
    }
}

pub fn gateway_api_key_from_env() -> Option<String> {
    std::env::var("AI_GATEWAY_API_KEY")
        .ok()
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty() && s != PLACEHOLDER_KEY)
}

pub fn gateway_base_url_from_env() -> String {
    std::env::var("AI_GATEWAY_BASE_URL")
        .ok()
        .map(|s| s.trim().trim_end_matches('/').to_string())
        .filter(|s| !s.is_empty())
        .unwrap_or_else(|| "https://ai-gateway.vercel.sh/v1".to_string())
}

#[derive(Debug, Clone)]
pub struct GatewayConfig {
    pub base_url: String,
    pub api_key: String,
}

impl GatewayConfig {
    pub fn from_env() -> Option<Self> {
        let api_key = gateway_api_key_from_env()?;
        Some(Self {
            base_url: gateway_base_url_from_env(),
            api_key,
        })
    }
}
