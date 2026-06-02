import { invoke } from "@tauri-apps/api/core";

function tauriAvailable(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Ask desktop shell to ensure localhost Cloud (:8788) is running. */
export async function ensureCloudDev(): Promise<boolean> {
  if (!tauriAvailable()) return false;
  try {
    return await invoke<boolean>("ensure_cloud_dev");
  } catch {
    return false;
  }
}
