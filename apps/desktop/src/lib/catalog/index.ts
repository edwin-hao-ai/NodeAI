import type { Lang } from "../../i18n";
import { fmtModelPrice } from "../model/pricing";
import type { GatewayModel } from "../model/types";

export { loadFavModels, loadRecentModels, pushRecentModel, saveFavModels, toggleFavModel } from "./storage";
export { buildCatalogSections, catalogProviders, catModelMatches, catSortModels, type CatalogSort } from "./sections";
export { CATALOG_TYPES, fmtCtx, providerColor, type CatalogType } from "./ui";

export function fmtModelCaption(lang: Lang, m: GatewayModel): string {
  return fmtModelPrice(lang, m);
}

// Re-export pool helpers for views that import from catalog
export { catalogModelPool, findCatalogModel } from "../model/pool";
