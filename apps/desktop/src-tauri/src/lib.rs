use std::sync::Mutex;

use nodeai_core::{AppSettings, ProxyStatus};
use nodeai_proxy::{ProxyHandle, status_from_config};
use tauri::Manager;

struct AppState {
    settings: AppSettings,
    proxy: Option<ProxyHandle>,
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
            set_proxy_port
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
