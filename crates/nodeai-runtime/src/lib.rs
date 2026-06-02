//! Local BYOK runtime: upstream format conversion and agent tool orchestration.

pub mod agent;
pub mod format;

pub use agent::{AgentToolCall, AgentToolResult, RuntimeContext};
pub use format::{ApiFormat, convert_chat_request, convert_chat_response};
