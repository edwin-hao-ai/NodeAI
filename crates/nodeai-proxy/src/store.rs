use std::path::{Path, PathBuf};

use rusqlite::{Connection, params};
use serde_json;

use crate::usage::{BonusTotals, UsageSnapshot, UsageStore};

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

    pub fn init(&self) -> Result<(), String> {
        self.ensure_parent()?;
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
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
            ",
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn hydrate(&self, store: &UsageStore) -> Result<(), String> {
        if !self.path.exists() {
            return Ok(());
        }
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
        let mut apps = std::collections::HashMap::new();
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

        store.restore(apps, bonus);
        Ok(())
    }

    pub fn persist(&self, snapshot: &UsageSnapshot) -> Result<(), String> {
        self.ensure_parent()?;
        let conn = Connection::open(&self.path).map_err(|e| e.to_string())?;
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
            ",
        )
        .map_err(|e| e.to_string())?;

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
