import { invoke } from "@tauri-apps/api/core";
import { isTauriShell } from "./platform";

/** Ask desktop shell to ensure localhost Cloud (:8788) is running. */
export async function ensureCloudDev(): Promise<boolean> {
  if (!isTauriShell()) return false;
  try {
    return await invoke<boolean>("ensure_cloud_dev");
  } catch {
    return false;
  }
}
