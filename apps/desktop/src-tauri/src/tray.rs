//! macOS / Windows system tray — PRD §5.9.1 + `prototypes/dashboard.html` tray popover structure.

use serde::Deserialize;
use tauri::menu::{Menu, MenuItem, PredefinedMenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, Manager};

pub const TRAY_ID: &str = "main-tray";

/// Cloned menu rows updated from the webview (`sync_native_tray_menu`).
#[derive(Clone)]
pub struct TrayHudItems {
    pub status: MenuItem<tauri::Wry>,
    pub route: MenuItem<tauri::Wry>,
    pub tokens: MenuItem<tauri::Wry>,
    pub budget: MenuItem<tauri::Wry>,
    pub saved: MenuItem<tauri::Wry>,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TrayHudSync {
    pub status: String,
    pub route: String,
    pub tokens: String,
    pub budget_remain: String,
    pub saved_today: String,
    pub tooltip: String,
}

pub fn install_tray(app: &tauri::App) -> tauri::Result<()> {
    let status = MenuItem::with_id(app, "tray-hud-status", "NodeAI · 运行中", false, None::<&str>)?;
    let route = MenuItem::with_id(app, "tray-hud-route", "线路：—", false, None::<&str>)?;
    let tokens = MenuItem::with_id(app, "tray-hud-tokens", "实时用量：—", false, None::<&str>)?;
    let budget = MenuItem::with_id(app, "tray-hud-budget", "额度剩余：—", false, None::<&str>)?;
    let saved = MenuItem::with_id(app, "tray-hud-saved", "今日节省：—", false, None::<&str>)?;

    let sep1 = PredefinedMenuItem::separator(app)?;
    let open_hub = MenuItem::with_id(app, "tray-open-hub", "总览", true, None::<&str>)?;
    let open_chat = MenuItem::with_id(app, "tray-open-chat", "对话", true, None::<&str>)?;
    let open_bill = MenuItem::with_id(app, "tray-open-bill", "账单", true, None::<&str>)?;
    let sep2 = PredefinedMenuItem::separator(app)?;
    let show = MenuItem::with_id(app, "tray-show", "打开 NodeAI", true, None::<&str>)?;
    let quit = MenuItem::with_id(app, "tray-quit", "退出", true, None::<&str>)?;

    let menu = Menu::with_items(
        app,
        &[
            &status,
            &route,
            &tokens,
            &budget,
            &saved,
            &sep1,
            &open_hub,
            &open_chat,
            &open_bill,
            &sep2,
            &show,
            &quit,
        ],
    )?;

    app.manage(TrayHudItems {
        status: status.clone(),
        route: route.clone(),
        tokens: tokens.clone(),
        budget: budget.clone(),
        saved: saved.clone(),
    });

    let Some(icon) = app.default_window_icon().cloned() else {
        tracing::warn!("no window icon; system tray skipped");
        return Ok(());
    };

    TrayIconBuilder::with_id(TRAY_ID)
        .icon(icon)
        .menu(&menu)
        .tooltip("NodeAI")
        .show_menu_on_left_click(false)
        .on_tray_icon_event(|tray, event| {
            if let TrayIconEvent::Click {
                button: MouseButton::Left,
                button_state: MouseButtonState::Up,
                ..
            } = event
            {
                let app = tray.app_handle();
                show_main_window(&app);
                let _ = app.emit("tray-open-popover", ());
            }
        })
        .on_menu_event(|app, event| {
            let id = event.id.as_ref();
            match id {
                "tray-open-hub" => {
                    show_main_window(app);
                    let _ = app.emit("tray-navigate", "hub");
                }
                "tray-open-chat" => {
                    show_main_window(app);
                    let _ = app.emit("tray-navigate", "chat");
                }
                "tray-open-bill" => {
                    show_main_window(app);
                    let _ = app.emit("tray-navigate", "billing");
                }
                "tray-show" => show_main_window(app),
                "tray-quit" => app.exit(0),
                _ => {}
            }
        })
        .build(app)?;

    Ok(())
}

fn show_main_window(app: &tauri::AppHandle) {
    if let Some(w) = app.get_webview_window("main") {
        let _ = w.show();
        let _ = w.unminimize();
        let _ = w.set_focus();
    }
}

#[tauri::command]
pub fn sync_native_tray_menu(app: tauri::AppHandle, hud: TrayHudSync) -> Result<(), String> {
    let items = app.state::<TrayHudItems>();
    items.status.set_text(&hud.status).map_err(|e| e.to_string())?;
    items.route.set_text(&hud.route).map_err(|e| e.to_string())?;
    items.tokens.set_text(&hud.tokens).map_err(|e| e.to_string())?;
    items.budget.set_text(&hud.budget_remain).map_err(|e| e.to_string())?;
    items.saved.set_text(&hud.saved_today).map_err(|e| e.to_string())?;
    if let Some(tray) = app.tray_by_id(TRAY_ID) {
        let _ = tray.set_tooltip(Some(hud.tooltip.as_str()));
    }
    Ok(())
}
