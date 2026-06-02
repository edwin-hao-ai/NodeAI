//! HTTP client for NodeAI Cloud API (desktop edge → cloud, never Gateway directly).

pub mod auth;

use nodeai_core::{is_valid_session_token, CloudConfig, GatewayConfig, ModelCatalogEntry};
use reqwest::Client;
use serde_json::{json, Value};

#[derive(Debug, Clone)]
pub struct CloudSession {
    pub token: String,
    pub user: CloudUser,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct CloudUser {
    pub name: String,
    pub email: String,
    pub plan: String,
}

pub async fn register_account(
    cloud: &CloudConfig,
    email: &str,
    password: &str,
    name: Option<&str>,
) -> Result<CloudUser, String> {
    let url = format!("{}/v1/auth/register", cloud.base_url.trim_end_matches('/'));
    let resp = Client::new()
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&json!({ "email": email, "password": password, "name": name }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("register {status}: {body}"));
    }
    let payload: Value = resp.json().await.map_err(|e| e.to_string())?;
    serde_json::from_value(payload.get("user").cloned().unwrap_or(json!({})))
        .map_err(|_| "register: invalid user payload".to_string())
}

pub async fn fetch_session_user(cloud: &CloudConfig, session: &str) -> Result<CloudUser, String> {
    let url = format!("{}/v1/auth/me", cloud.base_url.trim_end_matches('/'));
    let resp = Client::new()
        .get(&url)
        .bearer_auth(session)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err("cloud session invalid or expired".into());
    }
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("cloud auth me {status}: {body}"));
    }
    let payload: Value = resp.json().await.map_err(|e| e.to_string())?;
    serde_json::from_value(payload.get("user").cloned().unwrap_or(json!({})))
        .map_err(|_| "cloud auth me: invalid user payload".to_string())
}

pub async fn create_session(
    cloud: &CloudConfig,
    email: &str,
    password: &str,
) -> Result<CloudSession, String> {
    let url = format!("{}/v1/auth/session", cloud.base_url.trim_end_matches('/'));
    let resp = Client::new()
        .post(&url)
        .header("Content-Type", "application/json")
        .json(&json!({ "email": email, "password": password }))
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("cloud auth {status}: {body}"));
    }
    let payload: Value = resp.json().await.map_err(|e| e.to_string())?;
    let token = payload
        .get("token")
        .and_then(|v| v.as_str())
        .filter(|t| is_valid_session_token(t))
        .ok_or_else(|| "cloud auth: missing token".to_string())?
        .to_string();
    let user: CloudUser = payload
        .get("user")
        .ok_or_else(|| "cloud auth: missing user".to_string())
        .and_then(|u| serde_json::from_value(u.clone()).map_err(|_| "cloud auth: invalid user".to_string()))?;
    Ok(CloudSession { token, user })
}

pub fn extract_session(headers: &[(String, String)]) -> Option<String> {
    for (k, v) in headers {
        if k.eq_ignore_ascii_case("authorization") {
            let token = v
                .trim()
                .strip_prefix("Bearer ")
                .or_else(|| v.trim().strip_prefix("bearer "))
                .unwrap_or(v.trim());
            if is_valid_session_token(token) {
                return Some(token.to_string());
            }
        }
        if k.eq_ignore_ascii_case("x-nodeai-cloud-token") && is_valid_session_token(v) {
            return Some(v.trim().to_string());
        }
    }
    None
}

pub async fn fetch_models(
    cloud: &CloudConfig,
    session: &str,
) -> Result<Vec<ModelCatalogEntry>, String> {
    let url = format!("{}/v1/models", cloud.base_url.trim_end_matches('/'));
    let client = Client::new();
    let resp = client
        .get(&url)
        .bearer_auth(session)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if resp.status() == reqwest::StatusCode::UNAUTHORIZED {
        return Err("cloud session invalid or expired".into());
    }
    if !resp.status().is_success() {
        let status = resp.status();
        let body = resp.text().await.unwrap_or_default();
        return Err(format!("cloud models {status}: {body}"));
    }
    let payload: Value = resp.json().await.map_err(|e| e.to_string())?;
    let Some(data) = payload.get("data").and_then(|d| d.as_array()) else {
        return Err("cloud models: missing data array".into());
    };
    let models: Vec<ModelCatalogEntry> = data
        .iter()
        .filter_map(|m| serde_json::from_value(m.clone()).ok())
        .collect();
    if models.is_empty() {
        return Err("cloud models: empty catalog".into());
    }
    Ok(models)
}

pub async fn relay_chat(
    cloud: &CloudConfig,
    session: &str,
    body: &Value,
    app_slug: Option<&str>,
) -> Result<reqwest::Response, String> {
    let url = format!("{}/v1/chat/completions", cloud.base_url.trim_end_matches('/'));
    let client = Client::new();
    let mut req = client
        .post(&url)
        .bearer_auth(session)
        .header("Content-Type", "application/json")
        .json(body);
    if let Some(app) = app_slug {
        req = req.header("X-NodeAI-App", app);
    }
    req.send().await.map_err(|e| e.to_string())
}

pub async fn relay_embeddings(cloud: &CloudConfig, session: &str, body: &Value) -> Result<reqwest::Response, String> {
    let url = format!("{}/v1/embeddings", cloud.base_url.trim_end_matches('/'));
    Client::new()
        .post(&url)
        .bearer_auth(session)
        .header("Content-Type", "application/json")
        .json(body)
        .send()
        .await
        .map_err(|e| e.to_string())
}

/// Dev-only: cloud server holds Gateway key and proxies upstream.
pub async fn fetch_gateway_models(gw: &GatewayConfig) -> Result<Vec<ModelCatalogEntry>, String> {
    let url = format!("{}/models", gw.base_url.trim_end_matches('/'));
    let resp = Client::new()
        .get(&url)
        .bearer_auth(&gw.api_key)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    if !resp.status().is_success() {
        return Err(format!("gateway models {}", resp.status()));
    }
    let payload: Value = resp.json().await.map_err(|e| e.to_string())?;
    let data = payload
        .get("data")
        .and_then(|d| d.as_array())
        .ok_or_else(|| "missing data".to_string())?;
    Ok(data
        .iter()
        .filter_map(|m| serde_json::from_value(m.clone()).ok())
        .collect())
}

pub async fn relay_gateway_chat(
    gw: &GatewayConfig,
    body: &Value,
    app_slug: Option<&str>,
) -> Result<reqwest::Response, String> {
    let url = format!("{}/chat/completions", gw.base_url.trim_end_matches('/'));
    let mut req = Client::new()
        .post(&url)
        .bearer_auth(&gw.api_key)
        .header("Content-Type", "application/json")
        .json(body);
    if let Some(app) = app_slug {
        req = req.header("X-NodeAI-App", app);
    }
    req.send().await.map_err(|e| e.to_string())
}

pub use auth::AuthStore;

pub async fn relay_http_response(
    resp: reqwest::Response,
) -> Result<(u16, Vec<(String, String)>, reqwest::Response), String> {
    let status = resp.status().as_u16();
    let mut headers = Vec::new();
    if let Some(ct) = resp.headers().get("content-type").and_then(|v| v.to_str().ok()) {
        headers.push(("content-type".into(), ct.to_string()));
    }
    Ok((status, headers, resp))
}

pub fn merge_with_virtual(
    virtual_models: Vec<ModelCatalogEntry>,
    remote: Vec<ModelCatalogEntry>,
) -> Vec<ModelCatalogEntry> {
    let mut seen: std::collections::HashSet<String> =
        virtual_models.iter().map(|m| m.id.clone()).collect();
    let mut out = virtual_models;
    for m in remote {
        if seen.insert(m.id.clone()) {
            out.push(m);
        }
    }
    out
}
