use std::path::PathBuf;
use std::sync::Mutex;

use nodeai_core::{is_valid_session_token, nodeai_data_dir};
use crate::CloudUser;
use rusqlite::{params, Connection};
use sha2::{Digest, Sha256};

#[derive(Debug, thiserror::Error)]
pub enum AuthError {
    #[error("{0}")]
    Message(String),
    #[error("database error: {0}")]
    Db(#[from] rusqlite::Error),
}

pub struct AuthStore {
    conn: Mutex<Connection>,
}

impl AuthStore {
    pub fn open_default() -> Result<Self, AuthError> {
        let path = Self::db_path();
        if let Some(parent) = path.parent() {
            std::fs::create_dir_all(parent).map_err(|e| AuthError::Message(e.to_string()))?;
        }
        let conn = Connection::open(&path)?;
        conn.execute_batch(
            "CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                email TEXT NOT NULL UNIQUE,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                plan TEXT NOT NULL DEFAULT 'pro-trial',
                created_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
            CREATE TABLE IF NOT EXISTS sessions (
                token TEXT PRIMARY KEY,
                user_id INTEGER NOT NULL,
                created_at TEXT NOT NULL DEFAULT (datetime('now')),
                FOREIGN KEY(user_id) REFERENCES users(id)
            );",
        )?;
        Ok(Self {
            conn: Mutex::new(conn),
        })
    }

    fn db_path() -> PathBuf {
        nodeai_data_dir().join("cloud-auth.db")
    }

    fn hash_password(password: &str, email: &str) -> String {
        let mut hasher = Sha256::new();
        hasher.update(email.trim().to_lowercase().as_bytes());
        hasher.update(b":");
        hasher.update(password.as_bytes());
        format!("{:x}", hasher.finalize())
    }

    pub fn register(
        &self,
        email: &str,
        password: &str,
        name: Option<&str>,
    ) -> Result<CloudUser, AuthError> {
        let email = email.trim().to_lowercase();
        if !email.contains('@') || password.len() < 6 {
            return Err(AuthError::Message(
                "invalid email or password (min 6 chars)".into(),
            ));
        }
        let display = name
            .map(str::trim)
            .filter(|s| !s.is_empty())
            .unwrap_or_else(|| email.split('@').next().unwrap_or("user"));
        let hash = Self::hash_password(password, &email);
        let conn = self.conn.lock().map_err(|_| AuthError::Message("lock poisoned".into()))?;
        conn.execute(
            "INSERT INTO users (email, name, password_hash, plan) VALUES (?1, ?2, ?3, 'pro-trial')",
            params![email, display, hash],
        )
        .map_err(|e| {
            if e.to_string().contains("UNIQUE") {
                AuthError::Message("email already registered".into())
            } else {
                AuthError::Db(e)
            }
        })?;
        Ok(CloudUser {
            name: display.to_string(),
            email,
            plan: "pro-trial".into(),
        })
    }

    pub fn login(&self, email: &str, password: &str) -> Result<(String, CloudUser), AuthError> {
        let email = email.trim().to_lowercase();
        let hash = Self::hash_password(password, &email);
        let conn = self.conn.lock().map_err(|_| AuthError::Message("lock poisoned".into()))?;
        let row: (i64, String, String, String) = conn
            .query_row(
                "SELECT id, name, email, plan FROM users WHERE email = ?1 AND password_hash = ?2",
                params![email, hash],
                |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?, r.get(3)?)),
            )
            .map_err(|_| AuthError::Message("invalid email or password".into()))?;
        let token = format!("nodeai_session_{}", uuid_simple());
        conn.execute(
            "INSERT INTO sessions (token, user_id) VALUES (?1, ?2)",
            params![token, row.0],
        )?;
        Ok((
            token,
            CloudUser {
                name: row.1,
                email: row.2,
                plan: row.3,
            },
        ))
    }

    pub fn validate_session(&self, token: &str) -> Result<CloudUser, AuthError> {
        if !is_valid_session_token(token) {
            return Err(AuthError::Message("invalid session token".into()));
        }
        let conn = self.conn.lock().map_err(|_| AuthError::Message("lock poisoned".into()))?;
        conn.query_row(
            "SELECT u.name, u.email, u.plan FROM sessions s
             JOIN users u ON u.id = s.user_id WHERE s.token = ?1",
            params![token.trim()],
            |r| {
                Ok(CloudUser {
                    name: r.get(0)?,
                    email: r.get(1)?,
                    plan: r.get(2)?,
                })
            },
        )
        .map_err(|_| AuthError::Message("session expired or invalid".into()))
    }
}

fn uuid_simple() -> String {
    use std::time::{SystemTime, UNIX_EPOCH};
    let nanos = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map(|d| d.as_nanos())
        .unwrap_or(0);
    format!("{nanos:x}")
}
