/// Parsed NodeAI per-app access code (`sk-nodeai-{app_slug}`).
#[derive(Debug, Clone, PartialEq, Eq)]
pub struct NodeaiAppKey {
    pub app_slug: String,
}

const PREFIX: &str = "sk-nodeai-";

/// Extract app slug from `Authorization: Bearer sk-nodeai-{app}`.
pub fn parse_nodeai_app_key(authorization: Option<&str>) -> Option<NodeaiAppKey> {
    let raw = authorization?.trim();
    let token = raw
        .strip_prefix("Bearer ")
        .or_else(|| raw.strip_prefix("bearer "))
        .unwrap_or(raw)
        .trim();
    let slug = token.strip_prefix(PREFIX)?;
    if slug.is_empty() || slug.contains(' ') {
        return None;
    }
    Some(NodeaiAppKey {
        app_slug: slug.to_string(),
    })
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn parses_bearer_app_key() {
        let key = parse_nodeai_app_key(Some("Bearer sk-nodeai-cursor"));
        assert_eq!(
            key,
            Some(NodeaiAppKey {
                app_slug: "cursor".to_string(),
            })
        );
    }

    #[test]
    fn rejects_non_nodeai_keys() {
        assert!(parse_nodeai_app_key(Some("Bearer sk-openai-xxx")).is_none());
        assert!(parse_nodeai_app_key(Some("Bearer sk-nodeai-")).is_none());
    }
}
