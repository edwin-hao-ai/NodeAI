import type { GatewayModel } from "../model/types";
import type { GatewayCatalogEntry, GatewayModelPricing } from "./types";

export function pricingUsdPerMillion(pricing?: GatewayModelPricing): {
  inputPerM: number;
  outputPerM: number;
  imageUnit?: number;
  videoUnit?: number;
} {
  if (!pricing) return { inputPerM: 0, outputPerM: 0 };
  const inputPerM = parseUsdPerToken(pricing.input) * 1_000_000;
  const outputPerM = parseUsdPerToken(pricing.output) * 1_000_000;
  return {
    inputPerM,
    outputPerM,
    imageUnit: pricing.image ? parseUsdPerToken(pricing.image) : undefined,
    videoUnit: pricing.video ? parseUsdPerToken(pricing.video) : undefined,
  };
}

function parseUsdPerToken(raw?: string): number {
  if (!raw) return 0;
  const n = Number.parseFloat(raw);
  return Number.isFinite(n) ? n : 0;
}

const PROVIDER_LABELS: Record<string, string> = {
  openai: "OpenAI",
  anthropic: "Anthropic",
  google: "Google",
  alibaba: "Alibaba",
  deepseek: "DeepSeek",
  meta: "Meta",
  mistral: "Mistral",
  bfl: "BFL",
  ideogram: "Ideogram",
  vertex: "Google",
  xai: "xAI",
  cohere: "Cohere",
  amazon: "Amazon",
};

export function providerLabel(entry: GatewayCatalogEntry): string {
  const key = (entry.owned_by || entry.id.split("/")[0] || "").toLowerCase();
  if (PROVIDER_LABELS[key]) return PROVIDER_LABELS[key];
  if (!key) return "Unknown";
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function gatewayKindToCatalogType(
  kind: string | undefined,
  id: string,
): GatewayModel["type"] {
  switch (kind) {
    case "language":
      return "lang";
    case "image":
      return "image";
    case "video":
      return "video";
    case "embedding":
      return "embed";
    default:
      break;
  }
  if (id.includes("embed")) return "embed";
  if (id.includes("video") || id.includes("wan")) return "video";
  if (id.includes("image") || id.includes("flux") || id.includes("imagen")) return "image";
  return "lang";
}

const TAG_TO_CAP: Record<string, string> = {
  "tool-use": "tools",
  vision: "vision",
  reasoning: "reason",
};

export function gatewayTagsToCaps(tags?: string[]): string[] {
  if (!tags?.length) return [];
  return tags.map((t) => TAG_TO_CAP[t] ?? t).filter(Boolean);
}

export function gatewayEntryToModel(entry: GatewayCatalogEntry): GatewayModel {
  const provider = providerLabel(entry);
  const type = gatewayKindToCatalogType(entry.type, entry.id);
  const { inputPerM, outputPerM, imageUnit, videoUnit } = pricingUsdPerMillion(entry.pricing);
  const name = entry.name?.trim() || entry.id;

  let priceIn = inputPerM;
  let priceOut = outputPerM;
  let priceUnit: string | undefined;
  if (type === "image" && imageUnit != null && imageUnit > 0) {
    priceIn = 0;
    priceOut = imageUnit;
    priceUnit = "image";
  } else if (type === "video" && videoUnit != null && videoUnit > 0) {
    priceIn = 0;
    priceOut = videoUnit;
    priceUnit = "video";
  }

  return {
    id: entry.id,
    type,
    provider,
    priceIn,
    priceOut,
    priceUnit,
    ctx: entry.context_window,
    speed: "balanced",
    caps: gatewayTagsToCaps(entry.tags),
    displayName: { zh: name, en: name },
    priceSource: "gateway",
  };
}
