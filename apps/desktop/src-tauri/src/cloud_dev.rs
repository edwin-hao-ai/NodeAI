use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::Duration;

use nodeai_core::{
    cloud_dev_port_free, cloud_fully_ready, cloud_listener_is_foreign, kill_dev_cloud_listener,
    CloudConfig,
};
use tauri::AppHandle;
use tauri::Manager;
use tauri_plugin_shell::ShellExt;

static SPAWN_IN_FLIGHT: AtomicBool = AtomicBool::new(false);

/// Ensure localhost Cloud dev API is listening (idempotent).
pub fn ensure_cloud_dev(app: &AppHandle, force: bool) -> bool {
    let cloud = CloudConfig::from_env();
    if !cloud.dev_local() {
        return true;
    }

    if force {
        if !cloud_dev_port_free(&cloud.base_url) {
            tracing::warn!(url = %cloud.base_url, "Force-restarting Cloud listener");
            let _ = kill_dev_cloud_listener(&cloud.base_url);
            std::thread::sleep(Duration::from_millis(400));
        }
    } else if let Some(bundled) = bundled_cloud_dev_path(app) {
        if !cloud_dev_port_free(&cloud.base_url)
            && cloud_listener_is_foreign(&cloud.base_url, &bundled)
        {
            tracing::warn!(
                url = %cloud.base_url,
                bundled = %bundled.display(),
                "Replacing foreign Cloud sidecar with bundled binary"
            );
            let _ = kill_dev_cloud_listener(&cloud.base_url);
            std::thread::sleep(Duration::from_millis(400));
        }
    }

    if cloud_fully_ready(&cloud.base_url) {
        SPAWN_IN_FLIGHT.store(false, Ordering::SeqCst);
        return true;
    }

    // Stale listener: /health OK but auth/session broken (login returns empty reply).
    if !cloud_dev_port_free(&cloud.base_url) && !cloud_fully_ready(&cloud.base_url) {
        tracing::warn!(url = %cloud.base_url, "Cloud auth probe failed — restarting listener");
        if kill_dev_cloud_listener(&cloud.base_url) {
            std::thread::sleep(Duration::from_millis(400));
        }
    }

    if cloud_fully_ready(&cloud.base_url) {
        SPAWN_IN_FLIGHT.store(false, Ordering::SeqCst);
        return true;
    }

    // Port already taken — wait for an existing healthy listener.
    if !cloud_dev_port_free(&cloud.base_url) {
        tracing::info!(url = %cloud.base_url, "Cloud port busy — waiting for existing listener");
        let ok = wait_for_cloud(&cloud.base_url);
        SPAWN_IN_FLIGHT.store(false, Ordering::SeqCst);
        return ok;
    }

    if SPAWN_IN_FLIGHT
        .compare_exchange(false, true, Ordering::SeqCst, Ordering::SeqCst)
        .is_ok()
    {
        spawn_cloud_dev(app);
    }

    let ok = wait_for_cloud(&cloud.base_url);
    SPAWN_IN_FLIGHT.store(false, Ordering::SeqCst);
    ok
}

pub fn ensure_cloud_dev_background(app: &AppHandle) {
    let handle = app.clone();
    std::thread::spawn(move || {
        ensure_cloud_dev(&handle, false);
    });
}

fn bundled_cloud_dev_path(app: &AppHandle) -> Option<PathBuf> {
    let dir = app.path().executable_dir().ok()?;
    let sidecar = dir.join("nodeai-cloud-dev");
    sidecar.is_file().then_some(sidecar)
}

fn spawn_cloud_dev(app: &AppHandle) {
    if try_sidecar(app) {
        return;
    }
    if try_shared_target_binary() {
        return;
    }
    try_cargo_run();
}

fn try_sidecar(app: &AppHandle) -> bool {
    match app.shell().sidecar("nodeai-cloud-dev") {
        Ok(cmd) => match cmd.spawn() {
            Ok(_) => {
                tracing::info!("spawned nodeai-cloud-dev sidecar");
                true
            }
            Err(err) => {
                tracing::warn!(%err, "sidecar spawn failed");
                false
            }
        },
        Err(err) => {
            tracing::warn!(%err, "sidecar not bundled");
            false
        }
    }
}

fn try_shared_target_binary() -> bool {
    let target = std::env::var("CARGO_TARGET_DIR")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            std::env::var("HOME")
                .map(|h| PathBuf::from(h).join(".cargo/shared-target"))
                .unwrap_or_default()
        });
    let bin = target.join("release/nodeai-cloud-dev");
    if !bin.is_file() {
        return false;
    }
    match Command::new(&bin)
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn()
    {
        Ok(_) => {
            tracing::info!(path = %bin.display(), "spawned nodeai-cloud-dev from target dir");
            true
        }
        Err(err) => {
            tracing::warn!(%err, path = %bin.display(), "failed to spawn target binary");
            false
        }
    }
}

fn try_cargo_run() {
    let repo_root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../../..");
    tracing::info!(?repo_root, "fallback: cargo run nodeai-cloud-dev");
    let _ = Command::new("cargo")
        .current_dir(repo_root)
        .args([
            "run",
            "-p",
            "nodeai-cloud",
            "--bin",
            "nodeai-cloud-dev",
            "--release",
        ])
        .stdout(Stdio::null())
        .stderr(Stdio::null())
        .spawn();
}

fn wait_for_cloud(base_url: &str) -> bool {
    for _ in 0..90 {
        if cloud_fully_ready(base_url) {
            tracing::info!(%base_url, "Cloud API ready");
            return true;
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    tracing::warn!(%base_url, "Cloud API still unreachable after ensure");
    false
}
