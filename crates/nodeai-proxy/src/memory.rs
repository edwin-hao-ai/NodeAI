use std::path::PathBuf;
use std::sync::Mutex;

use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct MemoryRow {
    pub id: String,
    pub tag: String,
    pub text_zh: String,
    pub text_en: String,
    pub from_zh: String,
    pub from_en: String,
    pub created_at: String,
}

pub struct MemoryDb {
    path: PathBuf,
    conn: Mutex<Connection>,
}

impl MemoryDb {
    pub fn open(path: PathBuf) -> Result<Self, String> {
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        let conn = Connection::open(&path).map_err(|e| e.to_string())?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS memories (
                id TEXT PRIMARY KEY,
                tag TEXT NOT NULL,
                text_zh TEXT NOT NULL,
                text_en TEXT NOT NULL,
                from_zh TEXT NOT NULL,
                from_en TEXT NOT NULL,
                created_at TEXT NOT NULL
            );",
        )
        .map_err(|e| e.to_string())?;
        Ok(Self {
            path,
            conn: Mutex::new(conn),
        })
    }

    pub fn path(&self) -> &PathBuf {
        &self.path
    }

    pub fn list(&self) -> Result<Vec<MemoryRow>, String> {
        let conn = self.conn.lock().map_err(|_| "memory db lock".to_string())?;
        let mut stmt = conn
            .prepare(
                "SELECT id, tag, text_zh, text_en, from_zh, from_en, created_at
                 FROM memories ORDER BY created_at DESC",
            )
            .map_err(|e| e.to_string())?;
        let rows = stmt
            .query_map([], |row| {
                Ok(MemoryRow {
                    id: row.get(0)?,
                    tag: row.get(1)?,
                    text_zh: row.get(2)?,
                    text_en: row.get(3)?,
                    from_zh: row.get(4)?,
                    from_en: row.get(5)?,
                    created_at: row.get(6)?,
                })
            })
            .map_err(|e| e.to_string())?;
        rows.collect::<Result<Vec<_>, _>>()
            .map_err(|e| e.to_string())
    }

    pub fn insert(&self, row: &MemoryRow) -> Result<(), String> {
        let conn = self.conn.lock().map_err(|_| "memory db lock".to_string())?;
        conn.execute(
            "INSERT INTO memories (id, tag, text_zh, text_en, from_zh, from_en, created_at)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
            params![
                row.id,
                row.tag,
                row.text_zh,
                row.text_en,
                row.from_zh,
                row.from_en,
                row.created_at
            ],
        )
        .map_err(|e| e.to_string())?;
        Ok(())
    }

    pub fn delete(&self, id: &str) -> Result<bool, String> {
        let conn = self.conn.lock().map_err(|_| "memory db lock".to_string())?;
        let n = conn
            .execute("DELETE FROM memories WHERE id = ?1", params![id])
            .map_err(|e| e.to_string())?;
        Ok(n > 0)
    }
}
