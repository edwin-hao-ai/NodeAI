use std::fs;
use std::path::{Component, Path, PathBuf};

use serde_json::Value;

#[derive(Debug, Clone)]
pub struct RuntimeContext {
    pub app_slug: String,
    pub workspace_root: Option<String>,
}

#[derive(Debug, Clone)]
pub struct AgentToolCall {
    pub name: String,
    pub arguments: Value,
}

#[derive(Debug, Clone)]
pub struct AgentToolResult {
    pub name: String,
    pub output: String,
    pub ok: bool,
}

pub fn expand_tilde(path: &str) -> PathBuf {
    let trimmed = path.trim();
    if let Some(rest) = trimmed.strip_prefix("~/") {
        if let Some(home) = dirs_home() {
            return home.join(rest);
        }
    }
    if trimmed == "~" {
        if let Some(home) = dirs_home() {
            return home;
        }
    }
    PathBuf::from(trimmed)
}

fn dirs_home() -> Option<PathBuf> {
    std::env::var("HOME")
        .ok()
        .map(PathBuf::from)
        .or_else(|| std::env::var("USERPROFILE").ok().map(PathBuf::from))
}

pub fn default_workspace_path() -> PathBuf {
    expand_tilde("~/Documents/NodeAI")
}

pub fn ensure_workspace(path: &str) -> Result<PathBuf, String> {
    let root = expand_tilde(path);
    fs::create_dir_all(&root).map_err(|e| format!("create workspace: {e}"))?;
    root.canonicalize()
        .map_err(|e| format!("resolve workspace: {e}"))
}

fn resolve_in_workspace(workspace: &Path, rel: &str) -> Result<PathBuf, String> {
    let rel = rel.trim().replace('\\', "/");
    if rel.is_empty() {
        return Err("path is required".into());
    }
    if rel.contains("..") {
        return Err("path traversal is not allowed".into());
    }

    let ws = workspace
        .canonicalize()
        .map_err(|e| format!("workspace missing: {e}"))?;
    let joined = ws.join(
        Path::new(&rel)
            .components()
            .filter_map(|c| match c {
                Component::Normal(v) => Some(v),
                Component::CurDir => None,
                _ => None,
            })
            .collect::<PathBuf>(),
    );

    if joined.exists() {
        let canon = joined.canonicalize().map_err(|e| e.to_string())?;
        if !canon.starts_with(&ws) {
            return Err("path is outside the workspace".into());
        }
        return Ok(canon);
    }

    if !joined.starts_with(&ws) {
        return Err("path is outside the workspace".into());
    }

    Ok(joined)
}

pub fn read_file(workspace: &Path, rel: &str) -> Result<String, String> {
    let path = resolve_in_workspace(workspace, rel)?;
    if path.is_dir() {
        return Err("expected a file path".into());
    }
    fs::read_to_string(&path).map_err(|e| format!("read failed: {e}"))
}

pub fn write_file(workspace: &Path, rel: &str, content: &str) -> Result<String, String> {
    let path = resolve_in_workspace(workspace, rel)?;
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent).map_err(|e| format!("mkdir failed: {e}"))?;
    }
    fs::write(&path, content).map_err(|e| format!("write failed: {e}"))?;
    Ok(format!("wrote {} bytes to {}", content.len(), rel))
}

pub fn list_dir(workspace: &Path, rel: &str) -> Result<String, String> {
    let path = if rel.trim().is_empty() || rel.trim() == "." {
        workspace
            .canonicalize()
            .map_err(|e| format!("workspace: {e}"))?
    } else {
        let resolved = resolve_in_workspace(workspace, rel)?;
        if !resolved.is_dir() {
            return Err("not a directory".into());
        }
        resolved
    };

    let mut names: Vec<String> = fs::read_dir(&path)
        .map_err(|e| format!("list failed: {e}"))?
        .filter_map(|entry| entry.ok().map(|e| e.file_name().to_string_lossy().into_owned()))
        .collect();
    names.sort();
    Ok(names.join("\n"))
}

fn arg_str(args: &Value, key: &str) -> Result<String, String> {
    args.get(key)
        .and_then(|v| v.as_str())
        .map(str::trim)
        .filter(|s| !s.is_empty())
        .map(str::to_string)
        .ok_or_else(|| format!("missing `{key}` argument"))
}

/// Execute a single local agent tool call within the workspace sandbox.
pub fn execute_tool(ctx: &RuntimeContext, call: &AgentToolCall) -> AgentToolResult {
    fn fail(call: &AgentToolCall, output: String) -> AgentToolResult {
        AgentToolResult {
            name: call.name.clone(),
            output,
            ok: false,
        }
    }

    tracing::info!(app = %ctx.app_slug, tool = %call.name, "agent tool invoked");
    let workspace = match ctx
        .workspace_root
        .as_deref()
        .map(ensure_workspace)
        .transpose()
    {
        Ok(Some(path)) => path,
        Ok(None) => match ensure_workspace("~/Documents/NodeAI") {
            Ok(path) => path,
            Err(err) => return fail(call, err),
        },
        Err(err) => return fail(call, err),
    };

    let result = match call.name.as_str() {
        "read_file" => arg_str(&call.arguments, "path").and_then(|path| read_file(&workspace, &path)),
        "write_file" => {
            let path = match arg_str(&call.arguments, "path") {
                Ok(path) => path,
                Err(err) => return fail(call, err),
            };
            let content = call
                .arguments
                .get("content")
                .and_then(|v| v.as_str())
                .unwrap_or("")
                .to_string();
            write_file(&workspace, &path, &content)
        }
        "list_dir" => {
            let path = call
                .arguments
                .get("path")
                .and_then(|v| v.as_str())
                .unwrap_or(".")
                .to_string();
            list_dir(&workspace, &path)
        }
        other => Err(format!("unknown tool: {other}")),
    };

    match result {
        Ok(output) => AgentToolResult {
            name: call.name.clone(),
            output,
            ok: true,
        },
        Err(err) => AgentToolResult {
            name: call.name.clone(),
            output: err,
            ok: false,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::fs;
    use std::time::{SystemTime, UNIX_EPOCH};

    fn temp_workspace() -> PathBuf {
        let stamp = SystemTime::now()
            .duration_since(UNIX_EPOCH)
            .map(|d| d.as_nanos())
            .unwrap_or(0);
        let dir = std::env::temp_dir().join(format!("nodeai-agent-test-{stamp}"));
        fs::create_dir_all(&dir).unwrap();
        dir
    }

    #[test]
    fn writes_and_reads_file() {
        let ws = temp_workspace();
        write_file(&ws, "notes/hello.txt", "hi").unwrap();
        let text = read_file(&ws, "notes/hello.txt").unwrap();
        assert_eq!(text, "hi");
    }

    #[test]
    fn rejects_path_traversal() {
        let ws = temp_workspace();
        assert!(read_file(&ws, "../secret").is_err());
    }
}
