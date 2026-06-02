import { invoke } from "@tauri-apps/api/core";

export async function saveSourceKey(sourceId: string, apiKey: string): Promise<void> {
  await invoke("save_source_key", { sourceId, apiKey });
}

export async function deleteSourceKey(sourceId: string): Promise<void> {
  await invoke("delete_source_key", { sourceId });
}

export async function testSourceUrl(url: string, apiKey: string): Promise<number> {
  return invoke<number>("test_source_url", { url, apiKey });
}
