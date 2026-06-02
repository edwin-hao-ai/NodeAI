import type { GatewayCatalogEntry } from "../gateway/types";
import { catalogModelPool } from "../model/pool";
import type { GatewayModel } from "../model/types";
import type { CatalogType } from "./ui";
import { featuredModelsFromCatalog } from "./featured";
import { flagshipScore } from "./flagship";

export type CatalogSort = "featured" | "cheap" | "fast" | "context";

function pool(gateway: GatewayCatalogEntry[] | null, cloudConfigured = false): GatewayModel[] {
  return catalogModelPool(gateway, cloudConfigured);
}

export function catModelMatches(
  m: GatewayModel,
  query: string,
  catalogType: CatalogType,
  catalogProvider: string,
): boolean {
  if (catalogType !== "all" && m.type !== catalogType) return false;
  if (catalogProvider !== "all" && m.provider !== catalogProvider) return false;
  if (!query) return true;
  const q = query.toLowerCase();
  const hay = `${m.displayName.zh} ${m.displayName.en} ${m.id} ${m.provider}`.toLowerCase();
  return hay.includes(q);
}

export function catSortModels(arr: GatewayModel[], sort: CatalogSort): GatewayModel[] {
  const a = arr.slice();
  if (sort === "cheap") a.sort((x, y) => x.priceIn + x.priceOut - (y.priceIn + y.priceOut));
  else if (sort === "fast") {
    const o: Record<string, number> = { fast: 0, balanced: 1, deep: 2 };
    a.sort((x, y) => (o[x.speed ?? "balanced"] ?? 1) - (o[y.speed ?? "balanced"] ?? 1));
  } else if (sort === "context") {
    a.sort((x, y) => (y.ctx ?? 0) - (x.ctx ?? 0));
  } else {
    a.sort((x, y) => flagshipScore(y.id) - flagshipScore(x.id) || x.id.localeCompare(y.id));
  }
  return a;
}

export function catalogProviders(
  catalogType: CatalogType,
  gateway: GatewayCatalogEntry[] | null,
  cloudConfigured = false,
): string[] {
  const models = pool(gateway, cloudConfigured).filter((m) => catalogType === "all" || m.type === catalogType);
  return [...new Set(models.map((m) => m.provider))];
}

function resolveModel(id: string, all: GatewayModel[]) {
  return all.find((m) => m.id === id);
}

export function buildCatalogSections(
  query: string,
  catalogType: CatalogType,
  catalogProvider: string,
  sort: CatalogSort,
  favs: string[],
  recents: string[],
  gateway: GatewayCatalogEntry[] | null,
  cloudConfigured = false,
): { titleKey?: string; count?: number; models: GatewayModel[] }[] {
  const all = pool(gateway, cloudConfigured);
  const noFilter = !query && catalogType === "all" && catalogProvider === "all";

  if (!noFilter) {
    const matched = catSortModels(
      all.filter((m) => catModelMatches(m, query, catalogType, catalogProvider)),
      sort,
    );
    return matched.length ? [{ count: matched.length, models: matched }] : [];
  }

  const sections: { titleKey?: string; count?: number; models: GatewayModel[] }[] = [];
  const favModels = favs.map((id) => resolveModel(id, all)).filter(Boolean) as GatewayModel[];
  const recentModels = recents
    .map((id) => resolveModel(id, all))
    .filter(Boolean)
    .filter((m) => !favs.includes(m!.id)) as GatewayModel[];

  if (favModels.length) sections.push({ titleKey: "catFav", models: favModels });
  if (recentModels.length) sections.push({ titleKey: "catRecent", models: recentModels });

  const curated = featuredModelsFromCatalog(all);
  if (curated.length) sections.push({ titleKey: "catFeatured", models: curated });

  const pinned = new Set([...favs, ...recents, ...curated.map((m) => m.id)]);
  const rest = catSortModels(all.filter((m) => !pinned.has(m.id)), sort);
  sections.push({ titleKey: "catAll", count: rest.length, models: rest });
  return sections;
}
