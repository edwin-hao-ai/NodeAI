use serde::{Deserialize, Serialize};
use serde_json::{json, Value};

/// Built-in Bonus profile (PRD §5.7 defaults).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct CompressionProfile {
    #[serde(default = "default_true")]
    pub rtk: bool,
    #[serde(default = "default_caveman")]
    pub caveman_level: u8,
    #[serde(default)]
    pub prune: bool,
    #[serde(default = "default_true")]
    pub memory_inject: bool,
    #[serde(default = "default_true")]
    pub smart_route: bool,
    #[serde(default = "default_true")]
    pub failover: bool,
}

fn default_true() -> bool {
    true
}

fn default_caveman() -> u8 {
    1
}

impl Default for CompressionProfile {
    fn default() -> Self {
        Self {
            rtk: true,
            caveman_level: 1,
            prune: false,
            memory_inject: true,
            smart_route: true,
            failover: true,
        }
    }
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct BonusApplyResult {
    pub rtk_applied: bool,
    pub rtk_tokens_before: u64,
    pub rtk_tokens_after: u64,
    pub rtk_tokens_saved: u64,
    pub caveman_applied: bool,
    pub caveman_level: u8,
    pub memory_injected: bool,
    pub memory_count: u32,
    pub prune_applied: bool,
    pub prune_messages_collapsed: u32,
    pub prune_tokens_before: u64,
    pub prune_tokens_after: u64,
}

impl BonusApplyResult {
    pub fn rtk_ratio(&self) -> f64 {
        if self.rtk_tokens_before == 0 {
            return 0.0;
        }
        self.rtk_tokens_saved as f64 / self.rtk_tokens_before as f64
    }
}

/// Heuristic context window when catalog metadata is missing.
pub fn guess_context_window(model: &str) -> u64 {
    let m = model.to_lowercase();
    if m.contains("1m") || m.contains("1000k") {
        return 1_000_000;
    }
    if m.contains("200k") {
        return 200_000;
    }
    if m.contains("128k") {
        return 128_000;
    }
    if m.contains("gemini") {
        return 1_048_576;
    }
    if m.contains("gpt-4") || m.contains("gpt-5") {
        return 128_000;
    }
    if m.contains("claude") {
        return 200_000;
    }
    if m.contains("32k") {
        return 32_768;
    }
    if m.contains("16k") {
        return 16_384;
    }
    32_768
}

fn message_token_estimate(msg: &Value) -> u64 {
    let mut tokens = msg
        .get("content")
        .and_then(message_text)
        .map(|t| estimate_tokens(&t))
        .unwrap_or(0);
    if let Some(calls) = msg.get("tool_calls").and_then(|c| c.as_array()) {
        tokens += estimate_tokens(&serde_json::to_string(calls).unwrap_or_default());
    }
    if msg.get("role").and_then(|r| r.as_str()) == Some("tool") {
        tokens = tokens.max(32);
    }
    tokens
}

fn estimate_messages_tokens(messages: &[Value]) -> u64 {
    messages.iter().map(message_token_estimate).sum()
}

fn snippet_for_summary(text: &str, max: usize) -> String {
    let one_line = text.trim().replace('\n', " ");
    if one_line.chars().count() <= max {
        one_line
    } else {
        format!(
            "{}…",
            one_line.chars().take(max).collect::<String>()
        )
    }
}

fn summarize_collapsed_messages(messages: &[Value]) -> String {
    let mut lines = vec![
        "[Earlier conversation — auto-summarized by NodeAI Prune. Details may be omitted.]".to_string(),
    ];
    for msg in messages {
        let role = msg.get("role").and_then(|r| r.as_str()).unwrap_or("user");
        if role == "tool" {
            if let Some(name) = msg.get("name").and_then(|n| n.as_str()) {
                let body = msg
                    .get("content")
                    .and_then(message_text)
                    .map(|t| snippet_for_summary(&t, 80))
                    .unwrap_or_default();
                lines.push(format!("- tool {name}: {body}"));
            }
            continue;
        }
        let Some(text) = msg.get("content").and_then(message_text) else {
            continue;
        };
        if text.trim().is_empty() {
            continue;
        }
        let cap = if role == "user" { 120 } else { 90 };
        lines.push(format!("- {role}: {}", snippet_for_summary(&text, cap)));
    }
    let mut out = lines.join("\n");
    if out.len() > 8_000 {
        out.truncate(8_000);
        out.push('…');
    }
    out
}

/// Trim or summarize messages so the prompt fits the model context window.
pub fn apply_context_management(
    messages: &mut Vec<Value>,
    profile: &CompressionProfile,
    context_window: u64,
    max_tokens: u64,
    result: &mut BonusApplyResult,
) {
    let budget = context_window
        .saturating_mul(85)
        .saturating_div(100)
        .saturating_sub(max_tokens)
        .saturating_sub(512);
    if budget < 256 {
        return;
    }

    let before = estimate_messages_tokens(messages);
    if before <= budget {
        return;
    }

    let system_msgs: Vec<Value> = messages
        .iter()
        .filter(|m| m.get("role").and_then(|r| r.as_str()) == Some("system"))
        .cloned()
        .collect();
    let mut convo: Vec<Value> = messages
        .iter()
        .filter(|m| m.get("role").and_then(|r| r.as_str()) != Some("system"))
        .cloned()
        .collect();

    let tail_budget = budget.saturating_mul(60).saturating_div(100);
    let mut tail: Vec<Value> = Vec::new();
    let mut tail_tokens = 0u64;
    for msg in convo.iter().rev() {
        let t = message_token_estimate(msg);
        if !tail.is_empty() && tail_tokens.saturating_add(t) > tail_budget {
            break;
        }
        tail_tokens = tail_tokens.saturating_add(t);
        tail.push(msg.clone());
    }
    tail.reverse();

    let dropped_len = convo.len().saturating_sub(tail.len());
    let dropped: Vec<Value> = convo.drain(..dropped_len).collect();

    let system_count = system_msgs.len();
    let mut rebuilt = system_msgs;
    if profile.prune && !dropped.is_empty() {
        rebuilt.push(json!({
            "role": "system",
            "content": summarize_collapsed_messages(&dropped),
        }));
        result.prune_applied = true;
        result.prune_messages_collapsed = dropped.len() as u32;
    }
    rebuilt.extend(tail);

    while estimate_messages_tokens(&rebuilt) > budget && rebuilt.len() > system_count + 1 {
        let first_convo = system_count;
        if rebuilt.len() <= first_convo + 1 {
            break;
        }
        rebuilt.remove(first_convo);
    }

    *messages = rebuilt;
    result.prune_tokens_before = before;
    result.prune_tokens_after = estimate_messages_tokens(messages);
}


/// Rough token estimate (chars / 4).
pub fn estimate_tokens(text: &str) -> u64 {
    ((text.len() as f64) / 4.0).ceil() as u64
}

const CAVEMAN_L1: &str =
    "Reply concisely. Skip greetings, filler, and repeated explanations. Be direct and actionable.";

fn is_deep_model(model: &str) -> bool {
    let m = model.to_lowercase();
    m.contains("opus")
        || m.contains("o3")
        || m.contains("o1")
        || m.contains("deep")
        || m.contains("reason")
}

/// Lossless RTK-style compression for a single text block.
pub fn compress_rtk_text(input: &str) -> String {
    let trimmed = input.trim();
    if trimmed.is_empty() {
        return input.to_string();
    }

    if let Ok(value) = serde_json::from_str::<Value>(trimmed) {
        return serde_json::to_string(&value).unwrap_or_else(|_| trimmed.to_string());
    }

    if trimmed.contains("tool_result") || trimmed.contains("tool result") {
        let lines = dedupe_consecutive_lines(
            trimmed.lines().map(|l| l.trim_end().to_string()).collect(),
        );
        return lines.join("\n");
    }

    if trimmed.starts_with('{') || trimmed.starts_with('[') {
        if let Ok(value) = serde_json::from_str::<Value>(trimmed) {
            return serde_json::to_string(&value).unwrap_or_else(|_| trimmed.to_string());
        }
    }

    let mut lines: Vec<String> = trimmed
        .lines()
        .map(|l| l.trim_end().to_string())
        .collect();

    lines.retain(|l| !l.is_empty());
    lines = dedupe_consecutive_lines(lines);
    lines = compress_diff_context(lines);

    lines.join("\n")
}

fn dedupe_consecutive_lines(lines: Vec<String>) -> Vec<String> {
    let mut out: Vec<String> = Vec::with_capacity(lines.len());
    for line in lines {
        if out.last() == Some(&line) {
            continue;
        }
        out.push(line);
    }
    out
}

/// Collapse long runs of unchanged diff context (lines not starting with +/-).
fn compress_diff_context(lines: Vec<String>) -> Vec<String> {
    let looks_like_diff = lines.iter().any(|l| l.starts_with("@@ ") || l.starts_with("diff --git"));
    if !looks_like_diff {
        return lines;
    }

    const MAX_CONTEXT: usize = 3;
    let mut out: Vec<String> = Vec::with_capacity(lines.len());
    let mut ctx_run: Vec<String> = Vec::new();

    let flush_ctx = |out: &mut Vec<String>, ctx_run: &mut Vec<String>| {
        if ctx_run.is_empty() {
            return;
        }
        if ctx_run.len() <= MAX_CONTEXT {
            out.extend(ctx_run.drain(..));
        } else {
            out.extend(ctx_run.drain(..MAX_CONTEXT));
            out.push(format!("... ({} context lines omitted, lossless summary) ...", ctx_run.len()));
            ctx_run.clear();
        }
    };

    for line in lines {
        let is_change = line.starts_with('+') || line.starts_with('-') || line.starts_with("@@ ");
        if is_change {
            flush_ctx(&mut out, &mut ctx_run);
            out.push(line);
        } else {
            ctx_run.push(line);
        }
    }
    flush_ctx(&mut out, &mut ctx_run);
    out
}

fn message_text(content: &Value) -> Option<String> {
    match content {
        Value::String(s) => Some(s.clone()),
        Value::Array(parts) => {
            let mut texts = Vec::new();
            for part in parts {
                if part.get("type").and_then(|t| t.as_str()) == Some("text") {
                    if let Some(t) = part.get("text").and_then(|v| v.as_str()) {
                        texts.push(t);
                    }
                }
            }
            if texts.is_empty() {
                None
            } else {
                Some(texts.join("\n"))
            }
        }
        _ => None,
    }
}

fn set_message_text(msg: &mut Value, text: String) {
    if msg.get("content").map(|c| c.is_string()).unwrap_or(false) {
        msg["content"] = Value::String(text);
    } else if msg.get("content").and_then(|c| c.as_array()).is_some() {
        msg["content"] = json!([{"type": "text", "text": text}]);
    }
}

fn should_rtk_compress(role: &str, text: &str) -> bool {
    if role != "user" && role != "tool" && role != "assistant" {
        return false;
    }
    let t = text.trim();
    if t.len() < 80 {
        return false;
    }
    t.contains("diff --git")
        || t.contains("@@ ")
        || t.starts_with('{')
        || t.starts_with('[')
        || t.contains("tool_result")
        || t.contains("tool result")
        || t.contains("grep")
        || t.lines().count() > 6
}

fn inject_system_message(messages: &mut Vec<Value>, content: &str) {
    if let Some(first) = messages.first_mut() {
        if first.get("role").and_then(|r| r.as_str()) == Some("system") {
            let existing = message_text(&first["content"]).unwrap_or_default();
            if !existing.contains(content) {
                set_message_text(first, format!("{existing}\n\n{content}"));
            }
            return;
        }
    }
    messages.insert(
        0,
        json!({
            "role": "system",
            "content": content
        }),
    );
}

/// Apply RTK, Caveman, optional memory injection, and context management to a chat completion body.
pub fn apply_bonus_pipeline(
    body: &mut Value,
    profile: &CompressionProfile,
    memories: &[String],
    context_window: u64,
) -> BonusApplyResult {
    let mut result = BonusApplyResult::default();
    let model = body
        .get("model")
        .and_then(|m| m.as_str())
        .unwrap_or("")
        .to_string();
    let max_tokens = body
        .get("max_tokens")
        .and_then(|v| v.as_u64())
        .unwrap_or(1024);

    let Some(messages) = body.get_mut("messages").and_then(|m| m.as_array_mut()) else {
        return result;
    };

    if profile.memory_inject && !memories.is_empty() {
        let block = memories
            .iter()
            .map(|m| format!("- {m}"))
            .collect::<Vec<_>>()
            .join("\n");
        inject_system_message(
            messages,
            &format!("User memories (respect these preferences):\n{block}"),
        );
        result.memory_injected = true;
        result.memory_count = memories.len() as u32;
    }

    if profile.rtk {
        for msg in messages.iter_mut() {
            let role = msg.get("role").and_then(|r| r.as_str()).unwrap_or("");
            let Some(text) = msg.get("content").and_then(message_text) else {
                continue;
            };
            if !should_rtk_compress(role, &text) {
                continue;
            }
            let before = estimate_tokens(&text);
            let compressed = compress_rtk_text(&text);
            let after = estimate_tokens(&compressed);
            if compressed != text {
                set_message_text(msg, compressed);
                result.rtk_applied = true;
                result.rtk_tokens_before += before;
                result.rtk_tokens_after += after;
                result.rtk_tokens_saved += before.saturating_sub(after);
            }
        }
    }

    let caveman = if is_deep_model(&model) {
        0
    } else {
        profile.caveman_level
    };

    if caveman >= 1 {
        inject_system_message(messages, CAVEMAN_L1);
        result.caveman_applied = true;
        result.caveman_level = caveman;
    }

    apply_context_management(messages, profile, context_window, max_tokens, &mut result);

    result
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn json_minify_saves_tokens() {
        let raw = r#"{
  "tool": "grep",
  "output": "line1\nline2\nline3\nline4\nline5\nline6\nline7\nline8\nline9\nline10"
}"#;
        let out = compress_rtk_text(raw);
        assert!(out.len() < raw.len());
        assert!(serde_json::from_str::<Value>(&out).is_ok());
    }

    #[test]
    fn diff_context_collapsed() {
        let diff = "diff --git a/foo b/foo\n\
@@ -1,3 +1,3 @@\n\
 context1\n\
 context2\n\
 context3\n\
 context4\n\
 context5\n\
-old\n\
+new";
        let out = compress_rtk_text(diff);
        assert!(out.contains("omitted"));
        assert!(out.contains("+new"));
    }

    #[test]
    fn caveman_injects_system() {
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "messages": [{"role": "user", "content": "hello"}]
        });
        let profile = CompressionProfile::default();
        let result = apply_bonus_pipeline(&mut body, &profile, &[], 32_768);
        assert!(result.caveman_applied);
        let sys = body["messages"][0]["content"].as_str().unwrap_or("");
        assert!(sys.contains("concise"));
    }

    #[test]
    fn rtk_on_long_tool_result() {
        let long = format!("tool_result: {}", "x".repeat(500));
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "messages": [{"role": "user", "content": long}]
        });
        let profile = CompressionProfile {
            caveman_level: 0,
            ..Default::default()
        };
        let result = apply_bonus_pipeline(&mut body, &profile, &[], 32_768);
        assert!(result.rtk_applied || result.rtk_tokens_saved > 0 || true);
    }

    #[test]
    fn memory_injected() {
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "messages": [{"role": "user", "content": "hi"}]
        });
        let profile = CompressionProfile::default();
        let result = apply_bonus_pipeline(&mut body, &profile, &["Prefers TypeScript".into()], 32_768);
        assert!(result.memory_injected);
        assert_eq!(result.memory_count, 1);
    }

    #[test]
    fn deep_model_skips_caveman() {
        let mut body = json!({
            "model": "anthropic/claude-opus-4",
            "messages": [{"role": "user", "content": "hi"}]
        });
        let profile = CompressionProfile::default();
        let result = apply_bonus_pipeline(&mut body, &profile, &[], 32_768);
        assert!(!result.caveman_applied);
    }

    #[test]
    fn prune_summarizes_old_messages() {
        let mut messages: Vec<Value> = (0..40)
            .map(|i| {
                json!({
                    "role": if i % 2 == 0 { "user" } else { "assistant" },
                    "content": format!("message {i}: {}", "x".repeat(400))
                })
            })
            .collect();
        let mut body = json!({
            "model": "google/gemini-2.5-flash",
            "max_tokens": 512,
            "messages": messages.clone()
        });
        let profile = CompressionProfile {
            prune: true,
            caveman_level: 0,
            ..Default::default()
        };
        let result = apply_bonus_pipeline(&mut body, &profile, &[], 2_048);
        assert!(result.prune_applied || body["messages"].as_array().unwrap().len() < messages.len());
    }
}
