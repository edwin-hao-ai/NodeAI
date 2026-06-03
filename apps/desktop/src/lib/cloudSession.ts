import { invoke } from "@tauri-apps/api/core";

const LS_CLOUD_TOKEN = "nodeai-cloud-session-token";

export async function saveCloudSession(token: string): Promise<void> {
  const trimmed = token.trim();
  if (!trimmed) return;
  try {
    localStorage.setItem(LS_CLOUD_TOKEN, trimmed);
  } catch {
    /* ignore */
  }
  await invoke("save_cloud_session", { token: trimmed });
}

export async function clearCloudSession(): Promise<void> {
  try {
    localStorage.removeItem(LS_CLOUD_TOKEN);
  } catch {
    /* ignore */
  }
  try {
    await invoke("clear_cloud_session");
  } catch {
    /* ignore */
  }
}

export async function getCloudSession(): Promise<string | null> {
  try {
    const fromRust = await invoke<string | null>("get_cloud_session");
    if (fromRust?.trim()) {
      try {
        localStorage.setItem(LS_CLOUD_TOKEN, fromRust.trim());
      } catch {
        /* ignore */
      }
      return fromRust.trim();
    }
  } catch {
    /* browser dev / invoke unavailable */
  }
  try {
    const ls = localStorage.getItem(LS_CLOUD_TOKEN);
    return ls?.trim() ? ls.trim() : null;
  } catch {
    return null;
  }
}

export async function cloudSessionActive(): Promise<boolean> {
  try {
    return await invoke<boolean>("cloud_session_status");
  } catch {
    return false;
  }
}
