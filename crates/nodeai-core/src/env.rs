use std::path::{Path, PathBuf};

const PLACEHOLDER_KEY: &str = "your_vercel_ai_gateway_key_here";

/// Shared data dir: `~/.nodeai` (or `NODEAI_DATA_DIR`).
pub fn nodeai_data_dir() -> PathBuf {
    std::env::var("NODEAI_DATA_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".nodeai")
        })
}

/// Load Gateway / Cloud env vars from standard locations.
pub fn load_dotenv() {
    // User data dir first — Cloud URL and other desktop settings live here.
    let user_env = nodeai_data_dir().join(".env");
    if user_env.exists() {
        let _ = dotenvy::from_path(&user_env);
    }

    if gateway_api_key_from_env().is_some() {
        return;
    }
    let _ = dotenvy::dotenv();
    if gateway_api_key_from_env().is_some() {
        return;
    }

    if let Ok(exe) = std::env::current_exe() {
        if let Some(mac_env) = exe
            .parent()
            .and_then(|macos| macos.parent())
            .map(|contents| contents.join("Resources/.env"))
        {
            if mac_env.exists() {
                let _ = dotenvy::from_path(&mac_env);
                if gateway_api_key_from_env().is_some() {
                    return;
                }
            }
        }
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
