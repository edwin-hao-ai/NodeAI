import { invoke } from "@tauri-apps/api/core";
import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { UsageSnapshot } from "./bonusApi";
import { fmtMoney, fmtTokens } from "./format";
import { isTauriShell } from "./platform";

export interface TrayHudInput {
  lang: Lang;
  routeLine: string;
  routeApplying: boolean;
  cloudLoggedIn: boolean;
  localMode: boolean;
  usageSnapshot: UsageSnapshot | null;
}

function buildTrayHudStrings(input: TrayHudInput) {
  const { lang, routeLine, routeApplying, cloudLoggedIn, localMode, usageSnapshot } = input;
  const signedIn = cloudLoggedIn || localMode;

  const status = !signedIn
    ? `NodeAI · ${t(lang, "trayNotLoggedIn")}`
    : localMode && !cloudLoggedIn
      ? `NodeAI · ${t(lang, "trayLocalMode")}`
      : `NodeAI · ${t(lang, "trayRunning")}`;

  const route = routeApplying
    ? `${t(lang, "trayRouteLbl")} ${t(lang, "routeApplying")}`
    : `${t(lang, "trayRouteLbl")} ${routeLine}`;

  const today = usageSnapshot?.periods?.today;
  const todayTokens = today?.tokens ?? 0;
  const liveSaved = signedIn ? (today?.saved_yuan ?? 0) : 0;
  const cap = signedIn ? usageSnapshot?.budget?.cap_yuan : undefined;
  const used = usageSnapshot?.budget?.used_yuan ?? 0;
  const remain = cap != null ? Math.max(cap - used, 0) : null;

  const tokensLabel = `${t(lang, "tokenFlow")}：${
    !signedIn
      ? "—"
      : todayTokens > 0
        ? fmtTokens(todayTokens)
        : t(lang, "trayRunningShort")
  }`;

  const budgetLabel = `${t(lang, "budgetLeft")}：${
    remain != null ? fmtMoney(remain, lang) : "—"
  }`;

  const savedLabel = `${t(lang, "savedToday")}：${fmtMoney(liveSaved, lang)}`;

  const tooltip = !signedIn
    ? t(lang, "trayNotLoggedIn")
    : todayTokens > 0
      ? t(lang, "trayHudTokens").replace("{n}", fmtTokens(todayTokens))
      : liveSaved > 0
        ? t(lang, "trayHudSaved").replace("{v}", fmtMoney(liveSaved, lang))
        : t(lang, "trayRunningShort");

  return {
    status,
    route,
    tokens: tokensLabel,
    budgetRemain: budgetLabel,
    savedToday: savedLabel,
    tooltip,
  };
}

/** Push live HUD lines to the native system tray menu (macOS menu bar). */
export async function syncNativeTrayMenu(input: TrayHudInput): Promise<void> {
  if (!isTauriShell()) return;
  const hud = buildTrayHudStrings(input);
  try {
    await invoke("sync_native_tray_menu", {
      hud: {
        status: hud.status,
        route: hud.route,
        tokens: hud.tokens,
        budgetRemain: hud.budgetRemain,
        savedToday: hud.savedToday,
        tooltip: hud.tooltip,
      },
    });
  } catch {
    /* tray not ready */
  }
}
