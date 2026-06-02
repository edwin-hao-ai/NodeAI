//! Local BYOK runtime: upstream format conversion and agent tool orchestration.

pub mod agent;
pub mod format;

pub use agent::{
    default_workspace_path, ensure_workspace, execute_tool, AgentToolCall, AgentToolResult,
    RuntimeContext,
};
pub use format::{ApiFormat, convert_chat_request, convert_chat_response};
