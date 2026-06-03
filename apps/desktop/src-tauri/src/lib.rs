mod cloud_dev;
use std::sync::Mutex;

use keyring::Entry;
use nodeai_core::{save_sources_file, AppSettings, ByokSourceRecord, ProxyStatus, SourcesFile};
use nodeai_proxy::{ProxyHandle, status_from_config};
use nodeai_runtime::{default_workspace_path, ensure_workspace, execute_tool, AgentToolCall, RuntimeContext};
use serde::Deserialize;
use serde_json::json;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::TrayIconBuilder;
use tauri::Manager;

const KEYCHAIN_SERVICE: &str = "nodeai-desktop";
const CLOUD_SESSION_ACCOUNT: &str = "cloud-session";

struct AppState {
    settings: AppSettings,
    proxy: Option<ProxyHandle>,
}

#[derive(Debug, Deserialize)]
struct SourcePayload {
    id: String,
    name: String,
    url: String,
    format: String,
    has_key: bool,
}

fn keychain_entry(account: &str) -> Result<Entry, String> {
    Entry::new(KEYCHAIN_SERVICE, account).map_err(|e| e.to_string())
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

#[tauri::command]
fn save_cloud_session(token: String) -> Result<(), String> {
    keychain_entry(CLOUD_SESSION_ACCOUNT)?
        .set_password(token.trim())
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn clear_cloud_session() -> Result<(), String> {
    keychain_entry(CLOUD_SESSION_ACCOUNT)?
        .delete_credential()
        .map_err(|e| e.to_string())
}

#[tauri::command]
fn cloud_session_status() -> Result<bool, String> {
    Ok(keychain_entry(CLOUD_SESSION_ACCOUNT)?
        .get_password()
        .is_ok())
}

#[tauri::command]
fn get_cloud_session() -> Result<Option<String>, String> {
    match keychain_entry(CLOUD_SESSION_ACCOUNT)?.get_password() {
        Ok(token) if !token.trim().is_empty() => Ok(Some(token)),
        _ => Ok(None),
    }
}

#[tauri::command]
fn sync_model_sources(
    sources: Vec<SourcePayload>,
    default_id: Option<String>,
) -> Result<(), String> {
    let file = SourcesFile {
        default_source_id: default_id,
        sources: sources
            .into_iter()
            .map(|s| ByokSourceRecord {
                id: s.id,
                name: s.name,
                url: s.url,
                format: s.format,
                has_key: s.has_key,
            })
            .collect(),
    };
    save_sources_file(&file)
}

#[tauri::command]
fn agent_default_workspace() -> Result<String, String> {
    let path = default_workspace_path();
    let resolved = ensure_workspace(&path.to_string_lossy())?;
    Ok(resolved.to_string_lossy().to_string())
}

#[tauri::command]
fn agent_ensure_workspace(path: String) -> Result<String, String> {
    let resolved = ensure_workspace(&path)?;
    Ok(resolved.to_string_lossy().to_string())
}

#[tauri::command]
fn agent_execute_tool(
    workspace: String,
    name: String,
    arguments: serde_json::Value,
) -> Result<serde_json::Value, String> {
    let ctx = RuntimeContext {
        app_slug: "chat".into(),
        workspace_root: Some(workspace),
    };
    let call = AgentToolCall { name, arguments };
    let result = execute_tool(&ctx, &call);
    Ok(json!({
        "name": result.name,
        "output": result.output,
        "ok": result.ok,
    }))
}

#[tauri::command]
fn pick_agent_workspace(app: tauri::AppHandle) -> Result<Option<String>, String> {
    use tauri_plugin_dialog::DialogExt;
    match app
        .dialog()
        .file()
        .set_title("Agent workspace")
        .blocking_pick_folder()
    {
        None => Ok(None),
        Some(path) => {
            let path = path
                .into_path()
                .map_err(|_| "invalid folder path".to_string())?;
            Ok(Some(path.to_string_lossy().into_owned()))
        }
    }
}

#[tauri::command]
fn ensure_cloud_dev(app: tauri::AppHandle, force: Option<bool>) -> bool {
    cloud_dev::ensure_cloud_dev(&app, force.unwrap_or(false))
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            nodeai_core::load_dotenv();
            let cloud = nodeai_core::CloudConfig::from_env();
            if cloud.dev_local() {
                cloud_dev::ensure_cloud_dev_background(app.handle());
            }

            let settings = AppSettings::default();
            let proxy_config = settings.proxy.clone();

            let proxy = tauri::async_runtime::block_on(async {
                match nodeai_proxy::start(proxy_config.clone()).await {
                    Ok(handle) => Some(handle),
                    Err(err) => {
                        tracing::error!(
                            %err,
                            port = proxy_config.port,
                            "proxy failed to start (port in use?)"
                        );
                        None
                    }
                }
            });

            app.manage(Mutex::new(AppState { settings, proxy }));

            let show = MenuItem::with_id(app, "tray-show", "打开 NodeAI", true, None::<&str>)?;
            let quit = MenuItem::with_id(app, "tray-quit", "退出", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show, &quit])?;
            if let Some(icon) = app.default_window_icon().cloned() {
                let _tray = TrayIconBuilder::new()
                    .icon(icon)
                    .menu(&menu)
                    .tooltip("NodeAI")
                    .on_menu_event(|app, event| match event.id.as_ref() {
                        "tray-show" => {
                            if let Some(w) = app.get_webview_window("main") {
                                let _ = w.show();
                                let _ = w.unminimize();
                                let _ = w.set_focus();
                            }
                        }
                        "tray-quit" => app.exit(0),
                        _ => {}
                    })
                    .build(app)?;
            }

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_settings,
            get_proxy_status,
            set_proxy_port,
            save_source_key,
            delete_source_key,
            test_source_url,
            save_cloud_session,
            clear_cloud_session,
            cloud_session_status,
            get_cloud_session,
            sync_model_sources,
            agent_default_workspace,
            agent_ensure_workspace,
            agent_execute_tool,
            pick_agent_workspace,
            ensure_cloud_dev,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
