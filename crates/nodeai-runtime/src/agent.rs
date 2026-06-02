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

/// Execute a single local agent tool call (filesystem, shell stubs for MVP).
pub fn execute_tool(ctx: &RuntimeContext, call: &AgentToolCall) -> AgentToolResult {
    tracing::info!(app = %ctx.app_slug, tool = %call.name, "agent tool invoked");
    match call.name.as_str() {
        "read_file" | "write_file" | "list_dir" => AgentToolResult {
            name: call.name.clone(),
            output: format!(
                "tool `{}` queued for local runtime (workspace={:?})",
                call.name, ctx.workspace_root
            ),
            ok: true,
        },
        other => AgentToolResult {
            name: call.name.clone(),
            output: format!("unknown tool: {other}"),
            ok: false,
        },
    }
}
