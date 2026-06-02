import { invoke } from "@tauri-apps/api/core";

export async function saveCloudSession(token: string): Promise<void> {
  await invoke("save_cloud_session", { token });
}

export async function clearCloudSession(): Promise<void> {
  await invoke("clear_cloud_session");
}

export async function getCloudSession(): Promise<string | null> {
  try {
    return await invoke<string | null>("get_cloud_session");
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

/** Demo / dev token when Tauri invoke unavailable (browser-only vite preview). */
export function demoCloudToken(): string {
  return `nodeai_session_demo_${Date.now()}`;
}
