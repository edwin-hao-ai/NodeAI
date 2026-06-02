use std::sync::Mutex;

use keyring::Entry;
use nodeai_core::{AppSettings, ProxyStatus};
use nodeai_proxy::{ProxyHandle, status_from_config};
use tauri::Manager;

const KEYCHAIN_SERVICE: &str = "nodeai-desktop";

struct AppState {
    settings: AppSettings,
    proxy: Option<ProxyHandle>,
}

fn keychain_entry(source_id: &str) -> Result<Entry, String> {
    Entry::new(KEYCHAIN_SERVICE, source_id).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_settings(state: tauri::State<'_, Mutex<AppState>>) -> AppSettings {
    state.lock().expect("app state").settings.clone()
}

#[tauri::command]
fn get_proxy_status(state: tauri::State<'_, Mutex<AppState>>) -> ProxyStatus {
    let guard = state.lock().expect("app state");
    guard
        .proxy
        .as_ref()
        .map(|p| p.status.clone())
        .unwrap_or_else(|| {
            tauri::async_runtime::block_on(status_from_config(&guard.settings.proxy))
        })
}

#[tauri::command]
async fn set_proxy_port(
    port: u16,
    state: tauri::State<'_, Mutex<AppState>>,
) -> Result<ProxyStatus, String> {
    if !(1024..=65535).contains(&port) {
        return Err("port must be between 1024 and 65535".into());
    }

    let old_handle = {
        let mut guard = state.lock().expect("app state");
        guard.settings.proxy.port = port;
        guard.proxy.take()
    };

    if let Some(handle) = old_handle {
        handle.stop().await;
    }

    let proxy_config = {
        let guard = state.lock().expect("app state");
        guard.settings.proxy.clone()
    };

    let handle = nodeai_proxy::start(proxy_config)
        .await
        .map_err(|e| e.to_string())?;
    let status = handle.status.clone();

    state.lock().expect("app state").proxy = Some(handle);
    Ok(status)
}

#[tauri::command]
fn save_source_key(source_id: String, api_key: String) -> Result<(), String> {
    keychain_entry(&source_id)?
        .set_password(&api_key)
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_source_key(source_id: String) -> Result<(), String> {
    keychain_entry(&source_id)?
        .delete_credential()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn test_source_url(url: String, api_key: String) -> Result<u16, String> {
    let base = url.trim().trim_end_matches('/');
    let test_url = format!("{base}/models");
    let client = reqwest::Client::builder()
        .timeout(std::time::Duration::from_secs(15))
        .build()
        .map_err(|e| e.to_string())?;
    let resp = client
        .get(&test_url)
        .bearer_auth(api_key.trim())
        .send()
        .await
        .map_err(|e| e.to_string())?;
    let status = resp.status().as_u16();
    if resp.status().is_success() {
        Ok(status)
    } else {
        let body = resp.text().await.unwrap_or_default();
        Err(format!("HTTP {status}: {body}"))
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tracing_subscriber::fmt()
        .with_env_filter(
            tracing_subscriber::EnvFilter::try_from_default_env()
                .unwrap_or_else(|_| "nodeai_desktop=info,nodeai_proxy=info".into()),
        )
        .init();

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            nodeai_core::load_dotenv();
            let settings = AppSettings::default();
            let proxy_config = settings.proxy.clone();

            let proxy = tauri::async_runtime::block_on(async {
                nodeai_proxy::start(proxy_config).await.ok()
            });

            app.manage(Mutex::new(AppState { settings, proxy }));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            get_proxy_status,
            set_proxy_port,
            save_source_key,
            delete_source_key,
            test_source_url,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
