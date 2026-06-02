import { invoke } from "@tauri-apps/api/core";
import type { ModelSource } from "../state/AppContext";

export async function syncModelSources(
  sources: ModelSource[],
  defaultSourceId?: string | null,
): Promise<void> {
  await invoke("sync_model_sources", {
    sources: sources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      format: s.format,
      has_key: s.hasKey,
    })),
    defaultId: defaultSourceId ?? null,
  });
}
