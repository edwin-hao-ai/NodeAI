import { useMemo, useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { CopyButton } from "../components/ui/CopyButton";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { fmtMoney } from "../lib/format";
import { KNOWN_APPS } from "../lib/product/apps";
import { appName, isExternalApp, lastSeenLabel, liveAppsFromUsage } from "../lib/route";
import { useApp } from "../state/AppContext";

function statusLabel(s: string) {
  return s === "live" ? "●" : s === "new" ? "◉" : "○";
}

export function GatewayView() {
  const {
    lang,
    tr,
    gatewayBaseUrl,
    routeLine,
    routeAppCount,
    routeApplying,
    smartRouteEnabled,
    setView,
    cursorConnected,
    setCursorConnected,
    usageSnapshot,
    setAddAppOpen,
  } = useApp();

  const [tab, setTab] = useState<"setup" | "connected">("setup");
  const cursor = KNOWN_APPS.find((a) => a.id === "cursor");
  const liveApps = useMemo(() => liveAppsFromUsage(usageSnapshot), [usageSnapshot]);
  const externalApps = liveApps.filter(isExternalApp);

  return (
    <PageScroll>
      <PageHead title={tr("gwTitle")} compact />

      <div className="gw-route-banner">
        <div className="gw-route-top">
          <span className="vpn-status-dot" />
          <div style={{ flex: 1, minWidth: 0 }}>
            <strong>{tr("gwRouteTitle")}</strong>
            <div className="gw-route-meta">
              {routeApplying ? tr("routeApplying") : routeLine}
            </div>
          </div>
          <button type="button" className="btn-outlined" onClick={() => setView("models")}>
            {tr("gwChangeRoute")}
          </button>
        </div>
        <p>{tr("gwRouteApps").replace("{n}", String(routeAppCount))}</p>
        <p className="gw-route-hint">{tr("gwRouteHint")}</p>
      </div>

      <div className="gw-tabs">
        <button
          type="button"
          className={`gw-tab${tab === "setup" ? " active" : ""}`}
          onClick={() => setTab("setup")}
        >
          {tr("gwTabSetup")}
        </button>
        <button
          type="button"
          className={`gw-tab${tab === "connected" ? " active" : ""}`}
          onClick={() => setTab("connected")}
        >
          {tr("gwTabConnected")}
        </button>
      </div>

      {tab === "setup" ? (
        <div className="gw-panel active">
          <div className="gw-route-step0">
            <div className="gw-route-step0-head">
              <span className="material-symbols-outlined">looks_one</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>{tr("gwStep0Title")}</strong>
                <p style={{ margin: "4px 0 0", fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.5 }}>
                  {tr("gwStep0Sub")}
                </p>
              </div>
              <button type="button" className="btn-outlined" onClick={() => setView("models")}>
                {tr("gwChangeRoute")}
              </button>
            </div>
            <div className="gw-route-step0-line">{routeLine}</div>
          </div>

          <div className="connect-flow">
            <div className="flow-node">
              <div className="flow-icon">
                <span className="material-symbols-outlined">apps</span>
              </div>
              <span className="flow-lbl">{tr("flowYourApp")}</span>
            </div>
            <span className="material-symbols-outlined flow-arrow">arrow_forward</span>
            <div className="flow-node">
              <div className="flow-icon nodeai">
                <BrandMark size={26} />
              </div>
              <span className="flow-lbl">NodeAI</span>
            </div>
            <span className="material-symbols-outlined flow-arrow">arrow_forward</span>
            <div className="flow-node route-node">
              <div className="flow-icon">
                <span className="material-symbols-outlined">
                  {smartRouteEnabled ? "auto_awesome" : "route"}
                </span>
              </div>
              <span className="flow-lbl">{routeLine}</span>
            </div>
            <span className="material-symbols-outlined flow-arrow">arrow_forward</span>
            <div className="flow-node">
              <div className="flow-icon">
                <span className="material-symbols-outlined">savings</span>
              </div>
              <span className="flow-lbl">{tr("flowSave")}</span>
            </div>
          </div>

          <div className="gw-model-note">{tr("gwModelNoteText")}</div>

          <div className="addr-compact">
            <span className="material-symbols-outlined">link</span>
            <code>{gatewayBaseUrl}</code>
            <CopyButton text={gatewayBaseUrl} tipKey="tipCopyAddr" primary />
            <span className="status-pill" style={{ fontSize: 10, padding: "2px 8px" }}>
              <span className="dot" />
            </span>
          </div>
          <div className="addr-compact">
            <span className="material-symbols-outlined" style={{ color: "var(--savings)" }}>
              auto_awesome
            </span>
            <code>nodeai-auto</code>
            <CopyButton text="nodeai-auto" tipKey="tipCopyModel" primary />
            <span className="addr-compact-tag">{tr("modelFieldTag")}</span>
          </div>

          {cursor && !cursorConnected && cursor.steps && (
            <div className="setup-card gw-hero">
              <div className="gw-hero-title">
                <span
                  className="app-icon-wrap"
                  style={{
                    background: "color-mix(in srgb, var(--app-cursor) 15%, var(--surface-highest))",
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: "var(--app-cursor)" }}>
                    code
                  </span>
                </span>
                {tr("gwHeroTitle")}
              </div>
              <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 8 }}>
                {tr("gwHeroSub")}
              </p>
              <div className="gw-wait-pulse">
                <span className="live-dot" />
                <span>{tr("gwWaiting")}</span>
              </div>
              <button
                type="button"
                className="btn-outlined"
                style={{ marginBottom: 12 }}
                onClick={() => setCursorConnected(true)}
              >
                {tr("gwDemoConnect")}
              </button>
              <ol className="setup-steps">
                {cursor.steps[lang].map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ol>
            </div>
          )}

          {externalApps.map((a) => (
            <div key={a.id} className="setup-card compact">
              <div className="setup-row">
                <span
                  className="app-icon-wrap"
                  style={{
                    background: `color-mix(in srgb, ${a.color} 15%, var(--surface-highest))`,
                  }}
                >
                  <span className="material-symbols-outlined" style={{ color: a.color }}>
                    {a.icon}
                  </span>
                </span>
                <div className="setup-meta">
                  <div className="setup-meta-name">{appName(lang, a)}</div>
                  <div className="app-last">{lastSeenLabel(lang, a)}</div>
                </div>
                <span className={`app-status ${a.status === "live" ? "live" : "wait"}`}>
                  {statusLabel(a.status)}
                </span>
                <div className="setup-actions">
                  <CopyButton text={gatewayBaseUrl} tipKey="tipCopyAddr" />
                  <CopyButton text={a.key} tipKey="tipCopyCode" primary />
                </div>
              </div>
            </div>
          ))}

          <button className="btn-add-app" type="button" onClick={() => setAddAppOpen(true)}>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              add
            </span>
            <span>{tr("addApp")}</span>
          </button>
        </div>
      ) : (
        <div className="gw-panel active">
          <p style={{ fontSize: 13, color: "var(--on-surface-variant)", marginBottom: 12 }}>
            {tr("appsSub")}
          </p>
          {externalApps.filter((a) => a.status === "live").length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("gwWaiting")}</p>
          ) : (
            externalApps
              .filter((a) => a.status === "live")
              .map((a) => (
                <div key={a.id} className="app-card">
                  <div className="app-card-head">
                    <div className="app-card-name">
                      <span className="app-dot" style={{ background: a.color }} />
                      {appName(lang, a)}
                    </div>
                    <span className={`app-status ${a.status === "live" ? "live" : "wait"}`}>
                      {statusLabel(a.status)}
                    </span>
                  </div>
                  <div className="app-card-meta">
                    <div>
                      {tr("flow")}
                      <strong className="mono">{a.requests} req</strong>
                    </div>
                    <div>
                      {tr("todaySpend")}
                      <strong className="mono">{fmtMoney(a.spendToday, lang)}</strong>
                    </div>
                    <div>
                      {tr("accessCode")}
                      <strong className="mono key-mask">{a.key.slice(0, 12)}••••</strong>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      )}
    </PageScroll>
  );
}
