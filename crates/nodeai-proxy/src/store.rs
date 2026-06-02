use std::collections::HashMap;
use std::path::{Path, PathBuf};

use rusqlite::{params, Connection};
use serde_json;

use crate::usage::{AppStats, BonusTotals, LedgerEntry, UsageSnapshot, UsageStore};

pub struct UsageDb {
    path: PathBuf,
}

impl UsageDb {
    pub fn open_default() -> Self {
        let path = std::env::var("NODEAI_DATA_DIR")
            .map(PathBuf::from)
            .unwrap_or_else(|_| {
                dirs::home_dir()
                    .unwrap_or_else(|| PathBuf::from("."))
                    .join(".nodeai")
            })
            .join("usage.db");
        Self { path }
    }

    fn ensure_parent(&self) -> Result<(), String> {
        if let Some(parent) = self.path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        Ok(())
    }

    fn migrate(conn: &Connection) -> Result<(), String> {
        conn.execute_batch(
            "
            CREATE TABLE IF NOT EXISTS app_requests (
                app_slug TEXT PRIMARY KEY,
                count INTEGER NOT NULL DEFAULT 0
            );
            CREATE TABLE IF NOT EXISTS bonus_totals (
                id INTEGER PRIMARY KEY CHECK (id = 1),
                json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS app_stats (
                app_slug TEXT PRIMARY KEY,
                json TEXT NOT NULL
            );
            CREATE TABLE IF NOT EXISTS request_ledger (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                ts_ms INTEGER NOT NULL,
                app_slug TEXT NOT NULL,
                model TEXT NOT NULL,
                path TEXT NOT NULL,
                prompt_tokens INTEGER NOT NULL,
                completion_tokens INTEGER NOT NULL,
                cost_yuan REAL NOT NULL
            );
            CREATE INDEX IF NOT EXISTS idx_ledger_ts ON request_ledger(ts_ms DESC);
            ",
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn init(&self) -> Result<(), String> {
        self.ensure_parent()?;
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        Self::migrate(&conn)?;
        Ok(())
    }

    pub fn hydrate(&self, store: &UsageStore) -> Result<(), String> {
        if !self.path.exists() {
            return Ok(());
        }
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        Self::migrate(&conn)?;

        let mut apps = HashMap::new();
        let mut stmt = conn
            .prepare("SELECT app_slug, count FROM app_requests")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| Ok((row.get::<_, String>(0)?, row.get::<_, u64>(1)?)))
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (slug, count) = row.map_err(|e| e.to_string())?;
            apps.insert(slug, count);
        }

        let mut app_stats = HashMap::new();
        let mut stmt = conn
            .prepare("SELECT app_slug, json FROM app_stats")
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                let slug: String = row.get(0)?;
                let raw: String = row.get(1)?;
                Ok((slug, raw))
            })
            .map_err(|e| e.to_string())?;
        for row in rows {
            let (slug, raw) = row.map_err(|e| e.to_string())?;
            if let Ok(stats) = serde_json::from_str::<AppStats>(&raw) {
                app_stats.insert(slug, stats);
            }
        }

        let bonus: BonusTotals = conn
            .query_row(
                "SELECT json FROM bonus_totals WHERE id = 1",
                [],
                |row| {
                    let raw: String = row.get(0)?;
                    Ok(serde_json::from_str(&raw).unwrap_or_default())
                },
            )
            .unwrap_or_default();

        let ledger = Self::load_ledger_recent(&conn, 200)?;

        store.restore(apps, app_stats, bonus, ledger);
        Ok(())
    }

    fn load_ledger_recent(conn: &Connection, limit: usize) -> Result<Vec<LedgerEntry>, String> {
        let mut stmt = conn
            .prepare(
                "SELECT ts_ms, app_slug, model, path, prompt_tokens, completion_tokens, cost_yuan
                 FROM request_ledger ORDER BY ts_ms DESC LIMIT ?1",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map(params![limit as i64], |row| {
                Ok(LedgerEntry {
                    ts_ms: row.get(0)?,
                    app_slug: row.get(1)?,
                    model: row.get(2)?,
                    path: row.get(3)?,
                    prompt_tokens: row.get::<_, i64>(4)? as u64,
                    completion_tokens: row.get::<_, i64>(5)? as u64,
                    cost_yuan: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    pub fn append_ledger(&self, entry: &LedgerEntry) -> Result<(), String> {
        self.ensure_parent()?;
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        Self::migrate(&conn)?;
        conn.execute(
            "INSERT INTO request_ledger
             (ts_ms, app_slug, model, path, prompt_tokens, completion_tokens, cost_yuan)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                entry.ts_ms,
                entry.app_slug,
                entry.model,
                entry.path,
                entry.prompt_tokens as i64,
                entry.completion_tokens as i64,
                entry.cost_yuan,
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn persist(&self, snapshot: &UsageSnapshot) -> Result<(), String> {
        self.ensure_parent()?;
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        Self::migrate(&conn)?;

        let tx = conn.unchecked_transaction().map_err(|e| e.to_string())?;
        tx.execute("DELETE FROM app_requests", [])
            .map_err(|e| e.to_string())?;
        for (slug, count) in &snapshot.apps {
            tx.execute(
                "INSERT INTO app_requests (app_slug, count) VALUES (?1, ?2)",
                params![slug, count],
            )
            .map_err(|e| e.to_string())?;
        }

        tx.execute("DELETE FROM app_stats", [])
            .map_err(|e| e.to_string())?;
        for (slug, stats) in &snapshot.app_stats {
            let json = serde_json::to_string(stats).map_err(|e| e.to_string())?;
            tx.execute(
                "INSERT INTO app_stats (app_slug, json) VALUES (?1, ?2)",
                params![slug, json],
            )
            .map_err(|e| e.to_string())?;
        }

        let bonus_json = serde_json::to_string(&snapshot.bonus).map_err(|e| e.to_string())?;
        tx.execute(
            "INSERT INTO bonus_totals (id, json) VALUES (1, ?1)
             ON CONFLICT(id) DO UPDATE SET json = excluded.json",
            params![bonus_json],
        )
        .map_err(|e| e.to_string())?;
        tx.commit().map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn path(&self) -> &Path {
        &self.path
    }
}
