export const CATALOG_TYPES = ["all", "lang", "image", "video", "embed"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];

const PROVIDER_COLOR: Record<string, string> = {
  OpenAI: "#10A37F",
  Anthropic: "#D97757",
  Google: "#4285F4",
  Meta: "#0668E1",
  Mistral: "#F97316",
  DeepSeek: "#6366F1",
  Alibaba: "#FF6A00",
  BFL: "#6366F1",
  xAI: "#111827",
  Cohere: "#39594D",
};

export function providerColor(provider: string) {
  return PROVIDER_COLOR[provider] || "var(--surface-highest)";
}

export function fmtCtx(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}
