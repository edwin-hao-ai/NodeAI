import type { Lang } from "../../i18n";
import { t } from "../../i18n";
import type { GatewayCatalogEntry } from "../gateway/types";
import { findCatalogModel, catalogModelPool } from "../model/pool";
import type { GatewayModel } from "../model/types";
import { findProductIntent, PRODUCT_INTENTS } from "../product/intents";

export interface RouteState {
  smartRouteEnabled: boolean;
  activeIntent: string;
  activeGatewayModel: string;
  routeApplying: boolean;
}

export function intentLabel(lang: Lang, intentId: string): string {
  const intent = findProductIntent(intentId);
  return intent ? t(lang, intent.nameKey) : intentId;
}

function resolveIntentModel(
  intentId: string,
  catalog: GatewayCatalogEntry[] | null,
  cloudConfigured: boolean,
): GatewayModel | undefined {
  const intent = findProductIntent(intentId);
  if (!intent) return undefined;
  const preferred = findCatalogModel(intent.defaultModel, catalog, cloudConfigured);
  if (preferred) return preferred;
  return catalogModelPoolFallback(intent.modelType, catalog, cloudConfigured);
}

function catalogModelPoolFallback(
  type: GatewayModel["type"],
  catalog: GatewayCatalogEntry[] | null,
  cloudConfigured: boolean,
): GatewayModel | undefined {
  return catalogModelPool(catalog, cloudConfigured).find((m) => m.type === type);
}

export function resolvedModelForRoute(
  state: Pick<RouteState, "smartRouteEnabled" | "activeIntent" | "activeGatewayModel">,
  catalog: GatewayCatalogEntry[] | null,
  cloudConfigured = false,
): GatewayModel | undefined {
  if (state.smartRouteEnabled) {
    const fromIntent = resolveIntentModel(state.activeIntent, catalog, cloudConfigured);
    if (fromIntent) return fromIntent;
    return findCatalogModel(state.activeGatewayModel, catalog, cloudConfigured);
  }
  return findCatalogModel(state.activeGatewayModel, catalog, cloudConfigured);
}

export function getRouteLineShort(
  lang: Lang,
  state: Pick<RouteState, "smartRouteEnabled" | "activeIntent" | "activeGatewayModel">,
  catalog: GatewayCatalogEntry[] | null,
  cloudConfigured = false,
): string {
  if (state.smartRouteEnabled && state.activeIntent === "auto") {
    return `${t(lang, "autoRouteTitle")} · ${t(lang, "autoRouteLineSub")}`;
  }
  const intent = findProductIntent(state.activeIntent);
  const scene = intent ? intentLabel(lang, intent.id) : "";
  if (state.smartRouteEnabled) {
    const resolved = resolvedModelForRoute(state, catalog, cloudConfigured);
    const modelName = resolved?.displayName[lang] ?? "";
    return modelName ? `${scene} · ${modelName}` : scene || t(lang, "smartRouteTitle");
  }
  const m = findCatalogModel(state.activeGatewayModel, catalog, cloudConfigured);
  return m ? m.displayName[lang] : state.activeGatewayModel;
}

export { PRODUCT_INTENTS };
