import { listen } from "@tauri-apps/api/event";
import { useEffect, useMemo, useState } from "react";
import { BrandMark } from "./BrandMark";
import { fmtMoney, fmtTokens, sparkPath } from "../lib/format";
import { appForLedgerSlug, sparklineFromLedger } from "../lib/route";
import { isTauriShell } from "../lib/platform";
import { useApp } from "../state/AppContext";
import type { ViewId } from "../state/AppContext";

type TrayAppRow = {
  id: string;
  color: string;
  label: { zh: string; en: string };
  count: number;
};

function toTrayRow(slug: string, count: number): TrayAppRow {
  const app = appForLedgerSlug(slug);
  return { id: app.id, color: app.color, label: app.name, count };
}

export function Menubar({ nativeShell = false }: { nativeShell?: boolean }) {
  const {
    lang,
    toggleLang,
    tr,
    setView,
    routeLine,
    routeApplying,
    usageSnapshot,
    cloudLoggedIn,
    localMode,
  } = useApp();
  const [trayOpen, setTrayOpen] = useState(false);
  const traySignedIn = cloudLoggedIn || localMode;
  const cap = traySignedIn ? usageSnapshot?.budget?.cap_yuan : undefined;
  const used = usageSnapshot?.budget?.used_yuan ?? 0;
  const remain = cap != null ? Math.max(cap - used, 0) : null;

  const liveSaved = traySignedIn ? (usageSnapshot?.periods?.today?.saved_yuan ?? 0) : 0;

  const today = usageSnapshot?.periods?.today;
  const todayTokens = today?.tokens ?? 0;
  const spark = useMemo(() => sparklineFromLedger(usageSnapshot, 16), [usageSnapshot]);
  const sparkD = sparkPath(spark, 64, 24);

  const rateLabel = !traySignedIn
    ? tr("trayNotLoggedIn")
    : todayTokens > 0
      ? tr("trayHudTokens").replace("{n}", fmtTokens(todayTokens))
      : liveSaved > 0
        ? tr("trayHudSaved").replace("{v}", fmtMoney(liveSaved, lang))
        : tr("trayRunningShort");

  useEffect(() => {
    if (!isTauriShell()) return;
    const unsubs: Array<() => void> = [];
    void listen("tray-open-popover", () => setTrayOpen(true)).then((u) => unsubs.push(u));
    void listen<string>("tray-navigate", (e) => {
      setTrayOpen(false);
      const v = e.payload as ViewId;
      if (v === "hub" || v === "chat" || v === "billing") setView(v);
    }).then((u) => unsubs.push(u));
    return () => {
      unsubs.forEach((f) => f());
    };
  }, [setView]);

  useEffect(() => {
    if (!trayOpen) return;
    const close = () => setTrayOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [trayOpen]);

  const trayApps = useMemo((): TrayAppRow[] => {
    if (!usageSnapshot?.apps || Object.keys(usageSnapshot.apps).length === 0) {
      return [];
    }
    return Object.entries(usageSnapshot.apps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([slug, count]) => toTrayRow(slug, count));
  }, [usageSnapshot]);

  return (
    <>
      <header className={`menubar${nativeShell ? " menubar-native" : ""}`}>
        <div
          className={nativeShell ? "menubar-drag" : undefined}
          style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, flex: 1, minWidth: 0 }}
          {...(nativeShell ? { "data-tauri-drag-region": true } : {})}
        >
          <BrandMark size={15} />
          NodeAI
        </div>
        <div className="menubar-right">
          <button className="lang-btn" type="button" onClick={toggleLang}>
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <button
            className="tray-trigger"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setTrayOpen((o) => !o);
            }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--savings)" }}>
              shield
            </span>
            <span className="mono">{rateLabel}</span>
          </button>
        </div>
      </header>
      <div
        className={`tray-popover${trayOpen ? " open" : ""}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="dialog"
        aria-label={tr("tipTray")}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, fontWeight: 500 }}>
          <span className="live-dot" style={{ width: 8, height: 8 }} />
          <span>
            {!traySignedIn ? tr("trayNotLoggedIn") : localMode && !cloudLoggedIn ? tr("trayLocalMode") : tr("trayRunning")}
          </span>
        </div>
        <div className="tray-route">
          {routeApplying ? (
            tr("routeApplying")
          ) : (
            <>
              {tr("trayRouteLbl")}
              <strong>{routeLine}</strong>
            </>
          )}
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("tokenFlow")}</span>
          <span className="mono">{fmtTokens(todayTokens)}</span>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("budgetLeft")}</span>
          <span className="mono">{remain != null ? fmtMoney(remain, lang) : "—"}</span>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("savedToday")}</span>
          <span className="mono savings-text">{fmtMoney(liveSaved, lang)}</span>
        </div>
        <div className="tray-spark-wrap">
          <svg viewBox="0 0 64 24" aria-hidden>
            <path d={sparkD} className="hud-spark-path" fill="none" />
          </svg>
        </div>
        <div className="tray-apps-mini">
          {trayApps.length > 0 ? (
            trayApps.map((a) => (
              <span
                key={a.id}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                  marginRight: 8,
                  color: "var(--on-surface-variant)",
                }}
              >
                <span className="app-dot" style={{ background: a.color }} />
                {a.label[lang]}
                <span className="mono" style={{ color: "var(--primary)" }}>
                  {a.count}
                </span>
              </span>
            ))
          ) : (
            <span style={{ color: "var(--on-surface-variant)" }}>{tr("trayNoApps")}</span>
          )}
        </div>
        <div className="hud-pop-actions">
          <button type="button" onClick={() => { setTrayOpen(false); setView("hub"); }}>
            {tr("navHub")}
          </button>
          <button type="button" onClick={() => { setTrayOpen(false); setView("chat"); }}>
            {tr("navChat")}
          </button>
          <button type="button" onClick={() => { setTrayOpen(false); setView("billing"); }}>
            {tr("navBilling")}
          </button>
        </div>
      </div>
    </>
  );
}
