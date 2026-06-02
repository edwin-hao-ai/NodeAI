import type { I18nKey } from "../../i18n";
import type { GatewayModel } from "../model/types";

/** Smart-route scenes — defaults resolved against live Gateway catalog in UI. */
export interface ProductIntent {
  id: string;
  icon: string;
  nameKey: I18nKey;
  modelType: GatewayModel["type"];
  /** Preferred Gateway slug; falls back to first catalog model of `modelType`. */
  defaultModel: string;
}

export const PRODUCT_INTENTS: ProductIntent[] = [
  { id: "code", icon: "code", nameKey: "intentCode", modelType: "lang", defaultModel: "alibaba/qwen3-coder" },
  { id: "learn", icon: "school", nameKey: "intentLearn", modelType: "lang", defaultModel: "google/gemini-2.5-flash" },
  { id: "write", icon: "edit_note", nameKey: "intentWrite", modelType: "lang", defaultModel: "anthropic/claude-sonnet-4.6" },
  { id: "chat", icon: "chat", nameKey: "intentChat", modelType: "lang", defaultModel: "google/gemini-2.5-flash" },
  { id: "image", icon: "brush", nameKey: "intentImage", modelType: "image", defaultModel: "bfl/flux-2-pro" },
  { id: "video", icon: "movie", nameKey: "intentVideo", modelType: "video", defaultModel: "alibaba/wan-v2.6-t2v" },
  { id: "research", icon: "travel_explore", nameKey: "intentResearch", modelType: "lang", defaultModel: "google/gemini-2.5-pro" },
  { id: "embed", icon: "data_array", nameKey: "intentEmbed", modelType: "embed", defaultModel: "google/gemini-embedding-001" },
];

export function findProductIntent(id: string): ProductIntent | undefined {
  return PRODUCT_INTENTS.find((i) => i.id === id);
}
