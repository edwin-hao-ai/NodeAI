import type { GatewayCatalogEntry } from "../gateway/types";

const VIRTUAL_IDS = ["nodeai-auto", "nodeai-chat", "nodeai-code", "nodeai-fast", "nodeai-smart"] as const;

/** Offline virtual aliases (match nodeai-core default_virtual_models). */
export function defaultVirtualCatalog(): GatewayCatalogEntry[] {
  return VIRTUAL_IDS.map((id) => ({
    id,
    object: "model",
    owned_by: "nodeai",
    name: id,
    description: undefined,
    context_window: undefined,
    type: "language",
    tags: [],
    pricing: undefined,
  }));
}
