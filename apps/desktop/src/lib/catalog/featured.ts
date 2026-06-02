import type { GatewayModel } from "../model/types";
import { sortByFlagshipDesc } from "./flagship";

/** Pick latest flagship models per provider from live Gateway catalog. */
export function featuredModelsFromCatalog(all: GatewayModel[], limit = 8): GatewayModel[] {
  const candidates = all.filter((m) => m.priceSource === "gateway" && m.type === "lang");
  const byProvider = new Map<string, GatewayModel>();
  for (const m of sortByFlagshipDesc(candidates)) {
    if (!byProvider.has(m.provider)) {
      byProvider.set(m.provider, m);
    }
  }
  const diverse = sortByFlagshipDesc([...byProvider.values()]);
  if (diverse.length >= limit) {
    return diverse.slice(0, limit);
  }
  const rest = sortByFlagshipDesc(candidates.filter((m) => !diverse.some((d) => d.id === m.id)));
  return [...diverse, ...rest].slice(0, limit);
}
