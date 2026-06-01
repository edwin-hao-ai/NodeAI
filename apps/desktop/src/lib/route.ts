import type { Lang } from "../i18n";
import { t } from "../i18n";
import { DEMO } from "../data/demo";

export type GatewayModel = (typeof DEMO.GATEWAY_MODELS)[number];
export type AppRecord = (typeof DEMO.APPS)[number];

export interface RouteState {
  smartRouteEnabled: boolean;
  activeIntent: string;
  activeGatewayModel: string;
  routeApplying: boolean;
}

export function gatewayModelById(id: string): GatewayModel | undefined {
  return DEMO.GATEWAY_MODELS.find((m) => m.id === id);
}

export function intentLabel(lang: Lang, intentId: string): string {
  const intent = DEMO.INTENTS.find((i) => i.id === intentId);
  return intent ? t(lang, intent.nameKey as keyof typeof import("../i18n/zh.json")) : intentId;
}

export function resolvedModelForIntent(state: RouteState): GatewayModel | undefined {
  const intent = DEMO.INTENTS.find((i) => i.id === state.activeIntent);
  const id = intent?.defaultModel || state.activeGatewayModel;
  return gatewayModelById(id) ?? gatewayModelById(state.activeGatewayModel);
}

export function getRouteLineShort(lang: Lang, state: RouteState): string {
  if (state.smartRouteEnabled && state.activeIntent === "auto") {
    return `${t(lang, "autoRouteTitle")} · ${t(lang, "autoRouteLineSub")}`;
  }
  const intent = DEMO.INTENTS.find((i) => i.id === state.activeIntent);
  const scene = intent ? intentLabel(lang, intent.id) : "";
  if (state.smartRouteEnabled) {
    const resolved = resolvedModelForIntent(state);
    const modelName = resolved?.displayName[lang] ?? "";
    return modelName ? `${scene} · ${modelName}` : scene || t(lang, "smartRouteTitle");
  }
  const m = gatewayModelById(state.activeGatewayModel);
  return m ? m.displayName[lang] : state.activeGatewayModel;
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

export function fmtModelPrice(lang: Lang, m: GatewayModel): string {
  const unit = "priceUnit" in m ? (m as GatewayModel & { priceUnit?: string }).priceUnit : undefined;
  if (unit === "image") {
    return lang === "zh" ? `¥${m.priceOut.toFixed(2)}/张` : `¥${m.priceOut.toFixed(2)}/img`;
  }
  if (unit === "video") {
    return lang === "zh" ? `¥${m.priceOut.toFixed(1)}/条` : `¥${m.priceOut.toFixed(1)}/clip`;
  }
  if (m.type === "embed") {
    return lang === "zh" ? `¥${m.priceIn.toFixed(2)}/1M` : `¥${m.priceIn.toFixed(2)}/1M in`;
  }
  return lang === "zh"
    ? `入 ¥${m.priceIn.toFixed(2)} · 出 ¥${m.priceOut.toFixed(2)}/1M`
    : `In ¥${m.priceIn.toFixed(2)} · Out ¥${m.priceOut.toFixed(2)}/1M`;
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
