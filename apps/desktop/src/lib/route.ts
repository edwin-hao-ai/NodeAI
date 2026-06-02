import type { Lang } from "../i18n";
import { DEMO } from "../data/demo";
import { demoModelById } from "./model/demo";
import type { GatewayModel } from "./model/types";
import {
  getRouteLineShort,
  intentLabel,
  resolvedModelForRoute,
  type RouteState,
} from "./route/display";

export type { RouteState } from "./route/display";
export { getRouteLineShort, intentLabel, resolvedModelForRoute };
export type { GatewayModel } from "./model/types";
export { fmtModelPrice } from "./model/pricing";
export { catalogModelPool, findCatalogModel } from "./model/pool";

export type AppRecord = (typeof DEMO.APPS)[number];

/** @deprecated Prefer findCatalogModel(id, gatewayCatalog). */
export function gatewayModelById(id: string): GatewayModel | undefined {
  return demoModelById(id);
}

/** @deprecated Prefer resolvedModelForRoute(state, catalog). */
export function resolvedModelForIntent(state: RouteState): GatewayModel | undefined {
  return resolvedModelForRoute(state, null);
}

export function isBuiltinApp(app: AppRecord): boolean {
  return app.id === "nodeai-chat" || ("builtin" in app && Boolean(app.builtin));
}

export function isExternalApp(app: AppRecord): boolean {
  return !isBuiltinApp(app);
}

export function countRouteApps(cursorConnected: boolean): number {
  const apps = DEMO.APPS.filter((a) => {
    if (isBuiltinApp(a) || a.status === "live") return true;
    return String(a.id) === "cursor" && cursorConnected;
  });
  return apps.length || 1;
}

export function appName(lang: Lang, app: AppRecord): string {
  return app.name[lang];
}

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
