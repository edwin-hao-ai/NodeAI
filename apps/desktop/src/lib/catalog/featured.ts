import type { GatewayModel } from "../model/types";

/** Pick diverse featured models from live Gateway catalog (no static ID list). */
export function featuredModelsFromCatalog(all: GatewayModel[], limit = 8): GatewayModel[] {
  const candidates = all.filter((m) => m.priceSource === "gateway" && m.type === "lang");
  const byProvider = new Map<string, GatewayModel>();
  for (const m of candidates) {
    if (!byProvider.has(m.provider)) {
      byProvider.set(m.provider, m);
    }
  }
  const diverse = [...byProvider.values()];
  if (diverse.length >= limit) {
    return diverse.slice(0, limit);
  }
  const rest = candidates.filter((m) => !diverse.some((d) => d.id === m.id));
  return [...diverse, ...rest].slice(0, limit);
}
