use std::collections::HashMap;
use std::sync::{Arc, Mutex};

use nodeai_core::BonusApplyResult;
use serde::{Deserialize, Serialize};

#[derive(Clone, Default)]
pub struct UsageStore {
    inner: Arc<Mutex<UsageInner>>,
}

#[derive(Default)]
struct UsageInner {
    requests: HashMap<String, u64>,
    bonus: BonusTotals,
}

#[derive(Debug, Clone, Default, Serialize, Deserialize, PartialEq)]
pub struct BonusTotals {
    pub rtk_requests: u64,
    pub rtk_tokens_saved: u64,
    pub caveman_requests: u64,
    pub memory_injections: u64,
    /// Rough ¥ estimate from saved input tokens (demo rate).
    pub save_compress_yuan: f64,
    pub save_concise_yuan: f64,
}

impl UsageStore {
    pub fn record(&self, app_slug: &str) {
        let mut guard = self.inner.lock().expect("usage lock");
        *guard.requests.entry(app_slug.to_string()).or_insert(0) += 1;
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
    }

    pub fn snapshot(&self) -> HashMap<String, u64> {
        self.inner.lock().expect("usage lock").requests.clone()
    }

    pub fn bonus_totals(&self) -> BonusTotals {
        self.inner.lock().expect("usage lock").bonus.clone()
    }

    pub fn restore(&self, apps: HashMap<String, u64>, bonus: BonusTotals) {
        let mut guard = self.inner.lock().expect("usage lock");
        guard.requests = apps;
        guard.bonus = bonus;
    }

    pub fn full_snapshot(&self) -> UsageSnapshot {
        let guard = self.inner.lock().expect("usage lock");
        UsageSnapshot {
            apps: guard.requests.clone(),
            bonus: guard.bonus.clone(),
        }
    }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UsageSnapshot {
    pub apps: HashMap<String, u64>,
    pub bonus: BonusTotals,
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
}
