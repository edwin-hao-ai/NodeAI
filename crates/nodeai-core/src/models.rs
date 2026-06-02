use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ProxyStatus {
    pub running: bool,
    pub listen_addr: String,
    pub base_url: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VirtualModelAlias {
    pub id: String,
    pub display_name_zh: String,
    pub display_name_en: String,
}

/// Pricing from Vercel AI Gateway `/v1/models` (USD per token as strings).
#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub struct GatewayModelPricing {
    pub input: Option<String>,
    pub output: Option<String>,
    pub image: Option<String>,
    pub video: Option<String>,
    #[serde(default)]
    pub input_cache_read: Option<String>,
}

/// OpenAI-compatible model entry enriched with Gateway metadata.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelCatalogEntry {
    pub id: String,
    #[serde(default = "default_object")]
    pub object: String,
    pub owned_by: String,
    #[serde(default)]
    pub name: Option<String>,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub context_window: Option<u64>,
    #[serde(rename = "type", default)]
    pub kind: Option<String>,
    #[serde(default)]
    pub tags: Vec<String>,
    #[serde(default)]
    pub pricing: Option<GatewayModelPricing>,
}

fn default_object() -> String {
    "model".into()
}

impl ModelCatalogEntry {
    pub fn openai(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            object: "model".into(),
            owned_by: "nodeai".into(),
            name: None,
            description: None,
            context_window: None,
            kind: None,
            tags: Vec::new(),
            pricing: None,
        }
    }
}

pub fn default_virtual_models() -> Vec<ModelCatalogEntry> {
    [
        "nodeai-auto",
        "nodeai-chat",
        "nodeai-code",
        "nodeai-fast",
        "nodeai-smart",
    ]
    .into_iter()
    .map(ModelCatalogEntry::openai)
    .collect()
}
