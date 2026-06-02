import type { AppTemplate } from "./product/apps";
import {
  getRouteLineShort,
  intentLabel,
  resolvedModelForRoute,
} from "./route/display";

export type { RouteState } from "./route/display";
export { getRouteLineShort, intentLabel, resolvedModelForRoute };
export type { GatewayModel } from "./model/types";
export { fmtModelPrice } from "./model/pricing";
export { catalogModelPool, findCatalogModel } from "./model/pool";

export const MODEL_TYPE_ICON: Record<string, string> = {
  lang: "psychology",
  image: "brush",
  video: "movie",
  embed: "data_array",
};

export const MODEL_TYPE_KEY: Record<string, keyof typeof import("../i18n/zh.json")> = {
  lang: "modelTypeLang",
  image: "modelTypeImage",
  video: "modelTypeVideo",
  embed: "modelTypeEmbed",
};

export type { LiveApp, AppConnectionStatus } from "./apps/live";
export {
  liveAppsFromUsage,
  countConnectedApps,
  isCursorConnected,
  isBuiltinApp,
  isExternalApp,
  appName,
  lastSeenLabel,
  recentRouteLines,
  sparklineFromLedger,
  dailySpendBars,
  appForLedgerSlug,
} from "./apps/live";

export type AppRecord = AppTemplate;

/** @deprecated Use countConnectedApps(usageSnapshot). */
export function countRouteApps(_cursorConnected: boolean): number {
  return 1;
}
