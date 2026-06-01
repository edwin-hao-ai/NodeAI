import { useState } from "react";
import { fmtMoney, fmtRate } from "../lib/format";
import { DEMO } from "../data/demo";
import { appName } from "../lib/route";
import { useApp } from "../state/AppContext";

export function Menubar() {
  const { lang, proxy, toggleLang, tr, setView, routeLine } = useApp();
  const [trayOpen, setTrayOpen] = useState(false);
  const remain = DEMO.BUDGET.cap - DEMO.BUDGET.used;

  return (
    <>
      <header className="menubar">
        <div style={{ fontWeight: 500 }}>NodeAI</div>
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
            <span className="mono">1.2K/s</span>
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
          <span className="mono">{fmtRate(1240)}</span>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("budgetLeft")}</span>
          <span className="mono">{fmtMoney(remain, lang)}</span>
        </div>
        <div className="hud-pop-row">
          <span className="hud-pop-lbl">{tr("savedToday")}</span>
          <span className="mono savings-text">{fmtMoney(DEMO.BUDGET.saved, lang)}</span>
        </div>
        <div className="tray-apps-mini">
          {DEMO.APPS.filter((a) => a.status === "live").map((a) => (
            <div key={a.id} className="tray-app-row">
              <span className="app-dot" style={{ background: a.color }} />
              {appName(lang, a)}
              <span className="mono">{a.rate}/s</span>
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
