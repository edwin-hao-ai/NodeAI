use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::{SystemTime, UNIX_EPOCH};

use nodeai_core::BonusApplyResult;
use serde::{Deserialize, Serialize};

/// ¥0.018 per 1K tokens (PRD §3.5 overage rate).
pub const YUAN_PER_TOKEN: f64 = 0.000_018;

#[derive(Clone, Default)]
pub struct UsageStore {
    inner: Arc<Mutex<UsageInner>>,
}

#[derive(Default)]
struct UsageInner {
    requests: HashMap<String, u64>,
    app_stats: HashMap<String, AppStats>,
    bonus: BonusTotals,
    /// Recent ledger rows (newest first), capped in memory.
    ledger: Vec<LedgerEntry>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct AppStats {
    pub requests: u64,
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub spend_yuan: f64,
    pub last_seen_ms: i64,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LedgerEntry {
    pub ts_ms: i64,
    pub app_slug: String,
    pub model: String,
    pub path: String,
    pub prompt_tokens: u64,
    pub completion_tokens: u64,
    pub cost_yuan: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct BonusTotals {
    pub rtk_requests: u64,
    pub rtk_tokens_saved: u64,
    pub caveman_requests: u64,
    pub memory_injections: u64,
    pub save_compress_yuan: f64,
    pub save_concise_yuan: f64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct ModelSpend {
    pub model: String,
    pub amount_yuan: f64,
    pub tokens: u64,
    pub requests: u64,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PeriodStats {
    pub spend_yuan: f64,
    pub saved_yuan: f64,
    pub tokens: u64,
    pub requests: u64,
    pub save_compress_yuan: f64,
    pub save_concise_yuan: f64,
    pub save_route_yuan: f64,
    pub by_model: Vec<ModelSpend>,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct PeriodBundle {
    pub today: PeriodStats,
    pub week: PeriodStats,
    pub month: PeriodStats,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageSnapshot {
    pub apps: HashMap<String, u64>,
    pub app_stats: HashMap<String, AppStats>,
    pub bonus: BonusTotals,
    pub ledger: Vec<LedgerEntry>,
    pub periods: PeriodBundle,
    pub budget: BudgetSnapshot,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize)]
pub struct BudgetSnapshot {
    pub cap_yuan: f64,
    pub used_yuan: f64,
    pub plan: String,
}

const LEDGER_CAP: usize = 200;

pub fn now_ms() -> i64 {
    SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_millis() as i64)
        .unwrap_or(0)
}

pub fn cost_yuan(prompt_tokens: u64, completion_tokens: u64) -> f64 {
    (prompt_tokens + completion_tokens) as f64 * YUAN_PER_TOKEN
}

pub fn start_of_day_ms(now: i64) -> i64 {
    const DAY_MS: i64 = 86_400_000;
    (now / DAY_MS) * DAY_MS
}

impl UsageStore {
    pub fn record(&self, app_slug: &str) {
        let mut guard = self.inner.lock().expect("usage lock");
        *guard.requests.entry(app_slug.to_string()).or_insert(0) += 1;
    }

    pub fn record_completion(
        &self,
        app_slug: &str,
        model: &str,
        path: &str,
        prompt_tokens: u64,
        completion_tokens: u64,
    ) -> LedgerEntry {
        let ts_ms = now_ms();
        let cost = cost_yuan(prompt_tokens, completion_tokens);
        let entry = LedgerEntry {
            ts_ms,
            app_slug: app_slug.to_string(),
            model: model.to_string(),
            path: path.to_string(),
            prompt_tokens,
            completion_tokens,
            cost_yuan: cost,
        };

        let mut guard = self.inner.lock().expect("usage lock");
        *guard.requests.entry(app_slug.to_string()).or_insert(0) += 1;

        let stats = guard.app_stats.entry(app_slug.to_string()).or_default();
        stats.requests += 1;
        stats.prompt_tokens += prompt_tokens;
        stats.completion_tokens += completion_tokens;
        stats.spend_yuan += cost;
        stats.last_seen_ms = ts_ms;

        guard.ledger.insert(0, entry.clone());
        guard.ledger.truncate(LEDGER_CAP);

        entry
    }

    pub fn record_bonus(&self, result: &BonusApplyResult) {
        let mut guard = self.inner.lock().expect("usage lock");
        if result.rtk_applied && result.rtk_tokens_saved > 0 {
            guard.bonus.rtk_requests += 1;
            guard.bonus.rtk_tokens_saved += result.rtk_tokens_saved;
            guard.bonus.save_compress_yuan +=
                result.rtk_tokens_saved as f64 * 0.000002;
        }
        if result.caveman_applied {
            guard.bonus.caveman_requests += 1;
            guard.bonus.save_concise_yuan += 0.004;
        }
        if result.memory_injected {
            guard.bonus.memory_injections += 1;
        }
        if result.prune_applied {
            let saved = result
                .prune_tokens_before
                .saturating_sub(result.prune_tokens_after);
            if saved > 0 {
                guard.bonus.rtk_tokens_saved += saved;
                guard.bonus.save_compress_yuan += saved as f64 * 0.000002;
            }
        }
    }

    pub fn snapshot(&self) -> HashMap<String, u64> {
        self.inner.lock().expect("usage lock").requests.clone()
    }

    pub fn bonus_totals(&self) -> BonusTotals {
        self.inner.lock().expect("usage lock").bonus.clone()
    }

    pub fn app_stats_map(&self) -> HashMap<String, AppStats> {
        self.inner.lock().expect("usage lock").app_stats.clone()
    }

    pub fn ledger_recent(&self, limit: usize) -> Vec<LedgerEntry> {
        let guard = self.inner.lock().expect("usage lock");
        guard.ledger.iter().take(limit).cloned().collect()
    }

    pub fn restore(
        &self,
        apps: HashMap<String, u64>,
        app_stats: HashMap<String, AppStats>,
        bonus: BonusTotals,
        ledger: Vec<LedgerEntry>,
    ) {
        let mut guard = self.inner.lock().expect("usage lock");
        guard.requests = apps;
        guard.app_stats = app_stats;
        guard.bonus = bonus;
        guard.ledger = ledger;
        guard.ledger.truncate(LEDGER_CAP);
    }

    pub fn push_ledger_hydrate(&self, entries: Vec<LedgerEntry>) {
        let mut guard = self.inner.lock().expect("usage lock");
        guard.ledger = entries;
        guard.ledger.truncate(LEDGER_CAP);
    }

    pub fn aggregate_period(&self, since_ms: i64, bonus: &BonusTotals) -> PeriodStats {
        let guard = self.inner.lock().expect("usage lock");
        let mut stats = PeriodStats::default();
        let mut by_model: HashMap<String, ModelSpend> = HashMap::new();

        for row in guard.ledger.iter().filter(|r| r.ts_ms >= since_ms) {
            stats.spend_yuan += row.cost_yuan;
            stats.tokens += row.prompt_tokens + row.completion_tokens;
            stats.requests += 1;
            let m = by_model.entry(row.model.clone()).or_insert_with(|| ModelSpend {
                model: row.model.clone(),
                ..Default::default()
            });
            m.amount_yuan += row.cost_yuan;
            m.tokens += row.prompt_tokens + row.completion_tokens;
            m.requests += 1;
        }

        stats.save_compress_yuan = bonus.save_compress_yuan;
        stats.save_concise_yuan = bonus.save_concise_yuan;
        stats.save_route_yuan = stats.spend_yuan * 0.08;
        stats.saved_yuan =
            stats.save_compress_yuan + stats.save_concise_yuan + stats.save_route_yuan;

        let mut models: Vec<ModelSpend> = by_model.into_values().collect();
        models.sort_by(|a, b| {
            b.amount_yuan
                .partial_cmp(&a.amount_yuan)
                .unwrap_or(std::cmp::Ordering::Equal)
        });
        stats.by_model = models;
        stats
    }

    pub fn total_spend_yuan(&self) -> f64 {
        self.inner
            .lock()
            .expect("usage lock")
            .app_stats
            .values()
            .map(|s| s.spend_yuan)
            .sum()
    }

    pub fn full_snapshot(&self, plan: &str) -> UsageSnapshot {
        let guard = self.inner.lock().expect("usage lock");
        let now = now_ms();
        let day_start = start_of_day_ms(now);
        let week_start = now - 7 * 86_400_000;
        let month_start = now - 30 * 86_400_000;
        let bonus = guard.bonus.clone();

        drop(guard);

        let periods = PeriodBundle {
            today: self.aggregate_period(day_start, &bonus),
            week: self.aggregate_period(week_start, &bonus),
            month: self.aggregate_period(month_start, &bonus),
        };

        let used = self.total_spend_yuan();
        let cap = plan_budget_cap(plan);

        let guard = self.inner.lock().expect("usage lock");
        UsageSnapshot {
            apps: guard.requests.clone(),
            app_stats: guard.app_stats.clone(),
            bonus,
            ledger: guard.ledger.iter().take(50).cloned().collect(),
            periods,
            budget: BudgetSnapshot {
                cap_yuan: cap,
                used_yuan: used,
                plan: plan.to_string(),
            },
        }
    }
}

pub fn plan_budget_cap(plan: &str) -> f64 {
    match plan {
        "free" => 12.0,
        "pro" | "pro-trial" => 48.0,
        "team" => 180.0,
        _ => 48.0,
    }
}

/// Rough token estimate from chat request body (chars / 4).
pub fn estimate_prompt_tokens(body: &serde_json::Value) -> u64 {
    let mut chars = 0usize;
    if let Some(messages) = body.get("messages").and_then(|m| m.as_array()) {
        for msg in messages {
            if let Some(content) = msg.get("content") {
                chars += content_string_len(content);
            }
        }
    }
    if let Some(tools) = body.get("tools").and_then(|t| t.as_array()) {
        chars += serde_json::to_string(tools).map(|s| s.len()).unwrap_or(0);
    }
    ((chars / 4).max(1)) as u64
}

fn content_string_len(content: &serde_json::Value) -> usize {
    match content {
        serde_json::Value::String(s) => s.len(),
        serde_json::Value::Array(parts) => parts
            .iter()
            .map(|p| {
                p.get("text")
                    .and_then(|t| t.as_str())
                    .map(str::len)
                    .unwrap_or(0)
                    + p.get("image_url").map(|_| 512).unwrap_or(0)
            })
            .sum(),
        _ => content.to_string().len(),
    }
}

pub fn parse_usage_from_json(bytes: &[u8]) -> Option<(u64, u64)> {
    let value: serde_json::Value = serde_json::from_slice(bytes).ok()?;
    let usage = value.get("usage")?;
    let prompt = usage.get("prompt_tokens")?.as_u64()?;
    let completion = usage.get("completion_tokens").and_then(|v| v.as_u64()).unwrap_or(0);
    Some((prompt, completion))
}

pub fn estimate_completion_tokens(text_len: usize) -> u64 {
    ((text_len / 4).max(1)) as u64
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn counts_per_app() {
        let store = UsageStore::default();
        store.record("cursor");
        store.record("cursor");
        store.record("chat");
        let snap = store.snapshot();
        assert_eq!(snap.get("cursor"), Some(&2));
        assert_eq!(snap.get("chat"), Some(&1));
    }

    #[test]
    fn tracks_bonus() {
        let store = UsageStore::default();
        store.record_bonus(&BonusApplyResult {
            rtk_applied: true,
            rtk_tokens_saved: 100,
            caveman_applied: true,
            ..Default::default()
        });
        let bonus = store.bonus_totals();
        assert_eq!(bonus.rtk_requests, 1);
        assert_eq!(bonus.caveman_requests, 1);
        assert!(bonus.rtk_tokens_saved >= 100);
    }

    #[test]
    fn completion_updates_stats() {
        let store = UsageStore::default();
        store.record_completion("cursor", "gpt-4", "hosted", 100, 50);
        let stats = store.app_stats_map();
        assert_eq!(stats.get("cursor").unwrap().requests, 1);
        assert_eq!(stats.get("cursor").unwrap().prompt_tokens, 100);
        assert!(store.total_spend_yuan() > 0.0);
    }

    #[test]
    fn plan_caps() {
        assert_eq!(plan_budget_cap("free"), 12.0);
        assert_eq!(plan_budget_cap("pro-trial"), 48.0);
    }
}
