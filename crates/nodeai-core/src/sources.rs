use std::path::PathBuf;

use serde::{Deserialize, Serialize};

use crate::env::nodeai_data_dir;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq, Eq)]
pub struct ByokSourceRecord {
    pub id: String,
    pub name: String,
    pub url: String,
    pub format: String,
    pub has_key: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default, PartialEq, Eq)]
pub struct SourcesFile {
    #[serde(default)]
    pub default_source_id: Option<String>,
    #[serde(default)]
    pub sources: Vec<ByokSourceRecord>,
}

pub fn sources_path() -> PathBuf {
    nodeai_data_dir().join("sources.json")
}

pub fn load_sources_file() -> SourcesFile {
    let path = sources_path();
    if !path.exists() {
        return SourcesFile::default();
    }
    std::fs::read_to_string(&path)
        .ok()
        .and_then(|raw| serde_json::from_str(&raw).ok())
        .unwrap_or_default()
}

pub fn save_sources_file(file: &SourcesFile) -> Result<(), String> {
    let dir = nodeai_data_dir();
    std::fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    let json = serde_json::to_string_pretty(file).map_err(|e| e.to_string())?;
    std::fs::write(sources_path(), json).map_err(|e| e.to_string())
}

impl SourcesFile {
    pub fn resolve(&self, source_id: Option<&str>) -> Option<&ByokSourceRecord> {
        if let Some(id) = source_id {
            return self.sources.iter().find(|s| s.id == id);
        }
        if let Some(id) = self.default_source_id.as_deref() {
            if let Some(s) = self.sources.iter().find(|s| s.id == id && s.has_key) {
                return Some(s);
            }
        }
        self.sources.iter().find(|s| s.has_key)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn resolves_default_source() {
        let file = SourcesFile {
            default_source_id: Some("a".into()),
            sources: vec![
                ByokSourceRecord {
                    id: "a".into(),
                    name: "A".into(),
                    url: "https://example.com/v1".into(),
                    format: "openai".into(),
                    has_key: true,
                },
                ByokSourceRecord {
                    id: "b".into(),
                    name: "B".into(),
                    url: "https://b.com/v1".into(),
                    format: "openai".into(),
                    has_key: true,
                },
            ],
        };
        assert_eq!(file.resolve(None).map(|s| s.id.as_str()), Some("a"));
        assert_eq!(file.resolve(Some("b")).map(|s| s.id.as_str()), Some("b"));
    }
}
