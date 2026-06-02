use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::time::Duration;

use nodeai_core::{cloud_api_reachable, CloudConfig};

/// Debug builds: spawn `nodeai-cloud-dev` if localhost Cloud is not listening.
pub fn ensure_cloud_dev_background() {
    let cloud = CloudConfig::from_env();
    if cloud_api_reachable(&cloud.base_url) {
        tracing::info!(url = %cloud.base_url, "Cloud API already reachable");
        return;
    }

    let workspace = PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .join("../..")
        .canonicalize()
        .unwrap_or_else(|_| PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("../.."));

    tracing::info!(?workspace, "Spawning nodeai-cloud-dev (debug auto-start)");
    match Command::new("cargo")
        .current_dir(&workspace)
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
        .spawn()
    {
        Ok(_) => wait_for_cloud(&cloud.base_url),
        Err(err) => tracing::warn!(%err, "failed to spawn nodeai-cloud-dev — run ./scripts/dev.sh"),
    }
}

fn wait_for_cloud(base_url: &str) {
    for _ in 0..30 {
        if cloud_api_reachable(base_url) {
            tracing::info!(%base_url, "Cloud API ready");
            return;
        }
        std::thread::sleep(Duration::from_millis(500));
    }
    tracing::warn!(%base_url, "Cloud API still unreachable after auto-start");
}
