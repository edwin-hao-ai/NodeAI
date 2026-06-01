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

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ModelCatalogEntry {
    pub id: String,
    pub object: String,
    pub owned_by: String,
}

impl ModelCatalogEntry {
    pub fn openai(id: impl Into<String>) -> Self {
        Self {
            id: id.into(),
            object: "model".into(),
            owned_by: "nodeai".into(),
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
