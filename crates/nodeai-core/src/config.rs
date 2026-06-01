use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum TrafficPath {
    HostedQuota,
    ByokLocal,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyConfig {
    pub host: String,
    pub port: u16,
    /// Optional OpenAI-compatible upstream for BYOK relay (desktop-local path).
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub byok_upstream_url: Option<String>,
}

impl Default for ProxyConfig {
    fn default() -> Self {
        Self {
            host: crate::DEFAULT_LISTEN_HOST.to_string(),
            port: crate::DEFAULT_PROXY_PORT,
            byok_upstream_url: std::env::var("NODEAI_BYOK_UPSTREAM")
                .ok()
                .filter(|s| !s.is_empty()),
        }
    }
}

impl ProxyConfig {
    pub fn base_url(&self) -> String {
        format!("http://{}:{}/v1", self.host, self.port)
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct AppSettings {
    pub proxy: ProxyConfig,
    pub smart_route_enabled: bool,
    pub language: String,
    pub theme: String,
}
