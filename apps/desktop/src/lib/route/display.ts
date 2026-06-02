import type { Lang } from "../../i18n";
import { t } from "../../i18n";
import { DEMO } from "../../data/demo";
import type { GatewayCatalogEntry } from "../gateway/types";
import { findCatalogModel } from "../model/pool";
import type { GatewayModel } from "../model/types";

export interface RouteState {
  smartRouteEnabled: boolean;
  activeIntent: string;
  activeGatewayModel: string;
  routeApplying: boolean;
}

export function intentLabel(lang: Lang, intentId: string): string {
  const intent = DEMO.INTENTS.find((i) => i.id === intentId);
  return intent ? t(lang, intent.nameKey as keyof typeof import("../../i18n/zh.json")) : intentId;
}

export function resolvedModelForRoute(
  state: Pick<RouteState, "smartRouteEnabled" | "activeIntent" | "activeGatewayModel">,
  catalog: GatewayCatalogEntry[] | null,
): GatewayModel | undefined {
  if (state.smartRouteEnabled) {
    const intent = DEMO.INTENTS.find((i) => i.id === state.activeIntent);
    const id = intent?.defaultModel || state.activeGatewayModel;
    return findCatalogModel(id, catalog) ?? findCatalogModel(state.activeGatewayModel, catalog);
  }
  return findCatalogModel(state.activeGatewayModel, catalog);
}

export function getRouteLineShort(
  lang: Lang,
  state: Pick<RouteState, "smartRouteEnabled" | "activeIntent" | "activeGatewayModel">,
  catalog: GatewayCatalogEntry[] | null,
): string {
  if (state.smartRouteEnabled && state.activeIntent === "auto") {
    return `${t(lang, "autoRouteTitle")} · ${t(lang, "autoRouteLineSub")}`;
  }
  const intent = DEMO.INTENTS.find((i) => i.id === state.activeIntent);
  const scene = intent ? intentLabel(lang, intent.id) : "";
  if (state.smartRouteEnabled) {
    const resolved = resolvedModelForRoute(state, catalog);
    const modelName = resolved?.displayName[lang] ?? "";
    return modelName ? `${scene} · ${modelName}` : scene || t(lang, "smartRouteTitle");
  }
  const m = findCatalogModel(state.activeGatewayModel, catalog);
  return m ? m.displayName[lang] : state.activeGatewayModel;
}
