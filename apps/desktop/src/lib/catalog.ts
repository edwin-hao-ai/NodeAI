import { DEMO } from "../data/demo";
import type { Lang } from "../i18n";
import { fmtModelPrice, gatewayModelById, type GatewayModel } from "./route";

export const CATALOG_TYPES = ["all", "lang", "image", "video", "embed"] as const;
export type CatalogType = (typeof CATALOG_TYPES)[number];
export type CatalogSort = "featured" | "cheap" | "fast" | "context";

const STORAGE_FAV = "nodeai-fav-models";
const STORAGE_RECENT = "nodeai-recent-models";

export function loadFavModels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_FAV) || "[]");
  } catch {
    return [];
  }
}

export function saveFavModels(ids: string[]) {
  localStorage.setItem(STORAGE_FAV, JSON.stringify(ids));
}

export function loadRecentModels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_RECENT) || "[]");
  } catch {
    return [];
  }
}

export function pushRecentModel(id: string) {
  const next = [id, ...loadRecentModels().filter((x) => x !== id)].slice(0, 5);
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(next));
}

export function toggleFavModel(id: string): string[] {
  const favs = loadFavModels();
  const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
  saveFavModels(next);
  return next;
}

export function fmtCtx(n?: number): string {
  if (!n) return "";
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}K`;
  return String(n);
}

const PROVIDER_COLOR: Record<string, string> = {
  OpenAI: "#10A37F",
  Anthropic: "#D97757",
  Google: "#4285F4",
  Meta: "#0668E1",
  Mistral: "#F97316",
  DeepSeek: "#6366F1",
};

export function providerColor(p: string) {
  return PROVIDER_COLOR[p] || "var(--surface-highest)";
}

export function catModelMatches(
  m: GatewayModel,
  query: string,
  catalogType: CatalogType,
  catalogProvider: string,
): boolean {
  if (catalogType !== "all" && m.type !== catalogType) return false;
  if (catalogProvider !== "all" && m.provider !== catalogProvider) return false;
  if (query) {
    const q = query.toLowerCase();
    const hay = `${m.displayName.zh} ${m.displayName.en} ${m.id} ${m.provider}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

export function catSortModels(arr: GatewayModel[], sort: CatalogSort): GatewayModel[] {
  const a = arr.slice();
  if (sort === "cheap") a.sort((x, y) => x.priceIn + x.priceOut - (y.priceIn + y.priceOut));
  else if (sort === "fast") {
    const o: Record<string, number> = { fast: 0, balanced: 1, deep: 2 };
    a.sort((x, y) => (o[x.speed] ?? 1) - (o[y.speed] ?? 1));
  }   else if (sort === "context")
    a.sort((x, y) => (("ctx" in y ? y.ctx : 0) || 0) - (("ctx" in x ? x.ctx : 0) || 0));
  else
    a.sort(
      (x, y) =>
        (DEMO.CURATED_MODEL_IDS as readonly string[]).indexOf(y.id) -
        (DEMO.CURATED_MODEL_IDS as readonly string[]).indexOf(x.id),
    );
  return a;
}

export function catalogProviders(catalogType: CatalogType): string[] {
  const pool = DEMO.GATEWAY_MODELS.filter((m) => catalogType === "all" || m.type === catalogType);
  return [...new Set(pool.map((m) => m.provider))];
}

export function buildCatalogSections(
  query: string,
  catalogType: CatalogType,
  catalogProvider: string,
  sort: CatalogSort,
  favs: string[],
  recents: string[],
): { titleKey?: string; count?: number; models: GatewayModel[] }[] {
  const noFilter = !query && catalogType === "all" && catalogProvider === "all";
  if (!noFilter) {
    const matched = catSortModels(
      DEMO.GATEWAY_MODELS.filter((m) => catModelMatches(m, query, catalogType, catalogProvider)),
      sort,
    );
    return matched.length ? [{ count: matched.length, models: matched }] : [];
  }
  const sections: { titleKey?: string; count?: number; models: GatewayModel[] }[] = [];
  const favModels = favs.map(gatewayModelById).filter(Boolean) as GatewayModel[];
  const recentModels = recents
    .map(gatewayModelById)
    .filter(Boolean)
    .filter((m) => !favs.includes(m!.id)) as GatewayModel[];
  if (favModels.length) sections.push({ titleKey: "catFav", models: favModels });
  if (recentModels.length) sections.push({ titleKey: "catRecent", models: recentModels });
  const curated = DEMO.CURATED_MODEL_IDS.map(gatewayModelById).filter(Boolean) as GatewayModel[];
  sections.push({ titleKey: "catFeatured", models: curated });
  const restIds = new Set([...favs, ...recents, ...DEMO.CURATED_MODEL_IDS]);
  const rest = catSortModels(DEMO.GATEWAY_MODELS.filter((m) => !restIds.has(m.id)), sort);
  sections.push({ titleKey: "catAll", count: rest.length, models: rest });
  return sections;
}

export function modelPriceLabel(lang: Lang, m: GatewayModel) {
  return fmtModelPrice(lang, m);
}
