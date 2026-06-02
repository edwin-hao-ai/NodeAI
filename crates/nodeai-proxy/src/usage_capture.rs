use axum::body::Body;
use axum::http::Response;
use bytes::Bytes;
use std::pin::Pin;
use std::sync::Arc;
use std::task::{Context, Poll};

use crate::store::UsageDb;
use crate::usage::{
    estimate_completion_tokens, estimate_prompt_tokens, parse_usage_from_json, UsageStore,
};

pub fn record_chat_from_json_body(
    usage: &UsageStore,
    db: &Arc<UsageDb>,
    app_slug: &str,
    model: &str,
    path: &str,
    body: &serde_json::Value,
    response_bytes: &[u8],
) {
    let (prompt, completion) = parse_usage_from_json(response_bytes).unwrap_or_else(|| {
        let est_in = estimate_prompt_tokens(body);
        let text_len = serde_json::from_slice::<serde_json::Value>(response_bytes)
            .ok()
            .and_then(|v| {
                v.get("choices")?
                    .get(0)?
                    .get("message")?
                    .get("content")?
                    .as_str()
                    .map(str::len)
            })
            .unwrap_or(0);
        (est_in, estimate_completion_tokens(text_len))
    });

    persist_completion(usage, db, app_slug, model, path, prompt, completion);
}

pub fn persist_completion(
    usage: &UsageStore,
    db: &Arc<UsageDb>,
    app_slug: &str,
    model: &str,
    path: &str,
    prompt_tokens: u64,
    completion_tokens: u64,
) {
    let entry = usage.record_completion(app_slug, model, path, prompt_tokens, completion_tokens);
    if let Err(err) = db.append_ledger(&entry) {
        tracing::warn!(%err, "ledger append failed");
    }
    let plan = "pro-trial";
    if let Err(err) = db.persist(&usage.full_snapshot(plan)) {
        tracing::warn!(%err, "usage db persist failed");
    }
}

pub fn wrap_stream_for_usage(
    usage: UsageStore,
    db: Arc<UsageDb>,
    app_slug: String,
    model: String,
    path: String,
    prompt_tokens: u64,
    response: Response<Body>,
) -> Response<Body> {
    let (parts, body) = response.into_parts();
    let stream = body.into_data_stream();
    let acc = Arc::new(std::sync::Mutex::new(Vec::<u8>::new()));

    let wrapped = RecordingStream {
        inner: stream,
        acc: acc.clone(),
        recorded: false,
        usage,
        db,
        app_slug,
        model,
        path,
        prompt_tokens,
    };

    Response::from_parts(parts, Body::from_stream(wrapped))
}

struct RecordingStream<S> {
    inner: S,
    acc: Arc<std::sync::Mutex<Vec<u8>>>,
    recorded: bool,
    usage: UsageStore,
    db: Arc<UsageDb>,
    app_slug: String,
    model: String,
    path: String,
    prompt_tokens: u64,
}

impl<S, E> futures_util::Stream for RecordingStream<S>
where
    S: futures_util::Stream<Item = Result<Bytes, E>> + Unpin,
{
    type Item = Result<Bytes, E>;

    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        let this = self.as_mut().get_mut();
        match Pin::new(&mut this.inner).poll_next(cx) {
            Poll::Ready(Some(Ok(chunk))) => {
                if let Ok(mut guard) = this.acc.lock() {
                    guard.extend_from_slice(&chunk);
                }
                Poll::Ready(Some(Ok(chunk)))
            }
            Poll::Ready(Some(Err(e))) => {
                if !this.recorded {
                    this.recorded = true;
                    let bytes = this.acc.lock().map(|g| g.clone()).unwrap_or_default();
                    let completion = extract_stream_completion_tokens(&bytes);
                    persist_completion(
                        &this.usage,
                        &this.db,
                        &this.app_slug,
                        &this.model,
                        &this.path,
                        this.prompt_tokens,
                        completion,
                    );
                }
                Poll::Ready(Some(Err(e)))
            }
            Poll::Ready(None) => {
                if !this.recorded {
                    this.recorded = true;
                    let bytes = this.acc.lock().map(|g| g.clone()).unwrap_or_default();
                    let completion = extract_stream_completion_tokens(&bytes);
                    persist_completion(
                        &this.usage,
                        &this.db,
                        &this.app_slug,
                        &this.model,
                        &this.path,
                        this.prompt_tokens,
                        completion,
                    );
                }
                Poll::Ready(None)
            }
            Poll::Pending => Poll::Pending,
        }
    }
}

impl<S> Drop for RecordingStream<S> {
    fn drop(&mut self) {
        if self.recorded {
            return;
        }
        self.recorded = true;
        let bytes = self.acc.lock().map(|g| g.clone()).unwrap_or_default();
        let completion = extract_stream_completion_tokens(&bytes);
        persist_completion(
            &self.usage,
            &self.db,
            &self.app_slug,
            &self.model,
            &self.path,
            self.prompt_tokens,
            completion,
        );
    }
}

fn extract_stream_completion_tokens(bytes: &[u8]) -> u64 {
    let text = String::from_utf8_lossy(bytes);
    let mut completion_text_len = 0usize;
    for line in text.lines() {
        let line = line.trim();
        if !line.starts_with("data:") {
            continue;
        }
        let payload = line.trim_start_matches("data:").trim();
        if payload == "[DONE]" {
            continue;
        }
        if let Ok(v) = serde_json::from_str::<serde_json::Value>(payload) {
            if let Some(u) = v.get("usage") {
                if let Some(c) = u.get("completion_tokens").and_then(|x| x.as_u64()) {
                    return c;
                }
            }
            if let Some(delta) = v
                .pointer("/choices/0/delta/content")
                .and_then(|c| c.as_str())
            {
                completion_text_len += delta.len();
            }
        }
    }
    estimate_completion_tokens(completion_text_len)
}
