import { useMemo, useState } from "react";
import { BrandMark } from "./BrandMark";
import { fmtMoney, fmtRate, fmtTokens } from "../lib/format";
import { DEMO } from "../data/demo";
import { type AppRecord } from "../lib/route";
import { useApp } from "../state/AppContext";

type TrayAppRow = {
  id: string;
  color: string;
  label: { zh: string; en: string };
  count: number;
};

function appForUsageSlug(slug: string): AppRecord | undefined {
  return DEMO.APPS.find(
    (a) => a.key === `sk-nodeai-${slug}` || a.id === slug || a.id === `nodeai-${slug}`,
  );
}

function toTrayRow(slug: string, count: number): TrayAppRow {
  const app = appForUsageSlug(slug);
  if (app) {
    return { id: app.id, color: app.color, label: app.name, count };
  }
  return {
    id: slug,
    color: "var(--secondary)",
    label: { zh: slug, en: slug },
    count,
  };
}

export function Menubar() {
  const { lang, proxy, toggleLang, tr, setView, routeLine, usageSnapshot } = useApp();
  const [trayOpen, setTrayOpen] = useState(false);
  const remain = DEMO.BUDGET.cap - DEMO.BUDGET.used;

  const liveSaved =
    usageSnapshot?.bonus != null
      ? usageSnapshot.bonus.save_compress_yuan + usageSnapshot.bonus.save_concise_yuan
      : DEMO.BUDGET.saved;

  const totalRequests = usageSnapshot
    ? Object.values(usageSnapshot.apps).reduce((sum, n) => sum + n, 0)
    : 0;

  const flowLabel = totalRequests > 0 ? `${fmtTokens(totalRequests)} req` : fmtRate(0);

  const trayApps = useMemo((): TrayAppRow[] => {
    if (!usageSnapshot?.apps || Object.keys(usageSnapshot.apps).length === 0) {
      return DEMO.APPS.filter((a) => a.status === "live")
        .slice(0, 4)
        .map((a) => ({ id: a.id, color: a.color, label: a.name, count: a.today ?? 0 }));
    }
    return Object.entries(usageSnapshot.apps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([slug, count]) => toTrayRow(slug, count));
  }, [usageSnapshot]);

  return (
    <>
      <header className="menubar">
        <div style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500 }}>
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
            onClick={() => setTrayOpen((o) => !o)}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--savings)" }}>
              shield
            </span>
            <span className="mono">{flowLabel}</span>
          </button>
        </div>
      </header>
      <div className={`tray-popover${trayOpen ? " open" : ""}`}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, fontWeight: 500 }}>
          <span className="live-dot" style={{ width: 8, height: 8 }} />
          <span>{tr("trayRunning")}</span>
        </div>
        <div className="tray-route">
          {tr("trayRouteLbl")} <strong>{routeLine}</strong>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("tokenFlow")}</span>
          <span className="mono">{fmtRate(totalRequests > 0 ? Math.max(totalRequests * 8, 120) : 0)}</span>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("budgetLeft")}</span>
          <span className="mono">{fmtMoney(remain, lang)}</span>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("savedToday")}</span>
          <span className="mono savings-text">{fmtMoney(liveSaved, lang)}</span>
        </div>
        <div className="tray-apps-mini">
          {trayApps.map((row) => (
            <div key={row.id} className="tray-app-row">
              <span className="app-dot" style={{ background: row.color }} />
              {row.label[lang]}
              <span className="mono">{row.count}</span>
            </div>
          ))}
        </div>
        <div className="hud-pop-actions">
          <button type="button" onClick={() => { setView("hub"); setTrayOpen(false); }}>
            {tr("navHub")}
          </button>
          <button type="button" onClick={() => { setView("chat"); setTrayOpen(false); }}>
            {tr("navChat")}
          </button>
          <button type="button" onClick={() => { setView("billing"); setTrayOpen(false); }}>
            {tr("navBilling")}
          </button>
        </div>
        <p style={{ fontSize: 10, color: "var(--on-surface-variant)", marginTop: 8 }}>
          {proxy?.running ? proxy.base_url : "—"}
        </p>
      </div>
    </>
  );
}
