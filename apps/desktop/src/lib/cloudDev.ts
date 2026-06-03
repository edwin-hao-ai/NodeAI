import { invoke } from "@tauri-apps/api/core";
import { isTauriShell } from "./platform";

/** Ask desktop shell to ensure localhost Cloud (:8788) is running. */
export async function ensureCloudDev(force = false): Promise<boolean> {
  if (!isTauriShell()) return false;
  try {
    return await invoke<boolean>("ensure_cloud_dev", { force });
  } catch {
    return false;
  }
}

export function isCloudConnectivityAuthError(message: string): boolean {
  return (
    message.includes("error sending request") ||
    message.includes("Connection refused") ||
    message.includes("本地 Cloud 未就绪")
  );
}
