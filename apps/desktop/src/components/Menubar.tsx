import { useMemo, useState } from "react";
import { BrandMark } from "./BrandMark";
import { fmtMoney, fmtRate, fmtTokens } from "../lib/format";
import { appForLedgerSlug } from "../lib/route";
import { useApp } from "../state/AppContext";

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

export function Menubar() {
  const { lang, proxy, toggleLang, tr, setView, routeLine, usageSnapshot } = useApp();
  const [trayOpen, setTrayOpen] = useState(false);
  const cap = usageSnapshot?.budget?.cap_yuan ?? 48;
  const used = usageSnapshot?.budget?.used_yuan ?? 0;
  const remain = Math.max(cap - used, 0);

  const liveSaved = usageSnapshot?.periods?.today?.saved_yuan ?? 0;

  const totalRequests = usageSnapshot
    ? Object.values(usageSnapshot.apps).reduce((sum, n) => sum + n, 0)
    : 0;

  const flowLabel = totalRequests > 0 ? `${fmtTokens(totalRequests)} req` : fmtRate(0);

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
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            route
          </span>
          <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>
            {routeLine}
          </span>
        </div>
        <div className="tray-stats">
          <div>
            <div className="tray-stat-lbl">{tr("savedToday")}</div>
            <div className="tray-stat-val savings-text mono">{fmtMoney(liveSaved, lang)}</div>
          </div>
          <div>
            <div className="tray-stat-lbl">{tr("budgetLeft")}</div>
            <div className="tray-stat-val mono">{fmtMoney(remain, lang)}</div>
          </div>
        </div>
        {trayApps.length > 0 && (
          <div className="tray-apps">
            {trayApps.map((a) => (
              <div key={a.id} className="tray-app-row">
                <span className="app-dot" style={{ background: a.color }} />
                <span>{a.label[lang]}</span>
                <span className="mono">{a.count}</span>
              </div>
            ))}
          </div>
        )}
        <button type="button" className="tray-open-hub" onClick={() => { setTrayOpen(false); setView("hub"); }}>
          {tr("chatLiveLink")}
        </button>
        <div className="tray-foot mono">{proxy?.listen_addr ?? "8787"}</div>
      </div>
    </>
  );
}
