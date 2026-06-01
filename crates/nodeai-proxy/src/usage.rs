use std::collections::HashMap;
use std::sync::{Arc, Mutex};

#[derive(Clone, Default)]
pub struct UsageStore {
    requests: Arc<Mutex<HashMap<String, u64>>>,
}

impl UsageStore {
    pub fn record(&self, app_slug: &str) {
        let mut guard = self.requests.lock().expect("usage lock");
        *guard.entry(app_slug.to_string()).or_insert(0) += 1;
    }

    pub fn snapshot(&self) -> HashMap<String, u64> {
        self.requests.lock().expect("usage lock").clone()
    }
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
}
