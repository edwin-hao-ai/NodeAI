import { useEffect, useMemo, useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { DEMO } from "../data/demo";
import { fmtMoney, fmtRate, sparkAreaPath, sparkPath } from "../lib/format";
import { appName, isExternalApp } from "../lib/route";
import { useApp } from "../state/AppContext";

const SPARK = [12, 18, 14, 22, 28, 24, 30, 26, 32, 28, 34, 30, 36, 32, 38, 34, 40, 36, 38, 34, 36, 32, 34, 30, 32, 28, 30, 26, 28, 24, 26, 22, 24, 20, 22, 18, 20, 16, 18, 16];
const BAR_VALS = [18, 22, 20, 26, 24, 28, 32];

function statusClass(s: string) {
  return s === "live" ? "live" : s === "new" ? "new" : "wait";
}

export function HubView() {
  const {
    lang,
    tr,
    localMode,
    firstChatDone,
    cursorConnected,
    onboardDismissed,
    dismissOnboard,
    setView,
  } = useApp();

  const [routeLines, setRouteLines] = useState<
    { appId: string; icon: string; color: string; cost: string }[]
  >([]);

  const pct = DEMO.BUDGET.used / DEMO.BUDGET.cap;
  const ringOffset = 138 * (1 - pct);
  const remain = DEMO.BUDGET.cap - DEMO.BUDGET.used;
  const today = DEMO.BILL_PERIODS.today;

  useEffect(() => {
    const seed = DEMO.APPS.filter((a) => a.status === "live").slice(0, 3).map((a) => ({
      appId: a.id,
      icon: a.icon,
      color: a.color,
      cost: fmtMoney(Math.random() * 0.02, lang),
    }));
    setRouteLines(seed);
    const id = window.setInterval(() => {
      const app = DEMO.APPS.filter((a) => a.status === "live")[
        Math.floor(Math.random() * 3)
      ];
      if (!app) return;
      setRouteLines((prev) =>
        [{ appId: app.id, icon: app.icon, color: app.color, cost: fmtMoney(Math.random() * 0.02, lang) }, ...prev].slice(0, 6),
      );
    }, 4000);
    return () => window.clearInterval(id);
  }, [lang]);

  const onboardSteps = useMemo(() => {
    const state = {
      sendMsg: firstChatDone,
      viewSavings: true,
      connect: cursorConnected || localMode,
    };
    return [
      { k: "sendMsg", icon: "chat", label: tr("obStep1"), go: "chat" as const },
      { k: "viewSavings", icon: "savings", label: tr("obStep2"), go: "hub" as const },
      { k: "connect", icon: "cable", label: tr("obStep3"), go: "gateway" as const },
    ].map((s) => ({ ...s, done: state[s.k as keyof typeof state] }));
  }, [firstChatDone, cursorConnected, localMode, tr]);

  const onboardDone = onboardSteps.filter((s) => s.done).length;
  const showOnboard = !onboardDismissed && onboardDone < 3;

  const days =
    lang === "zh"
      ? ["一", "二", "三", "四", "五", "六", "今"]
      : ["M", "T", "W", "T", "F", "S", "Today"];

  return (
    <PageScroll>
      <PageHead title={tr("hubTitle")} compact />

      {showOnboard && (
        <div className="onboard-card">
          <div className="onboard-head">
            <div>
              <strong>{tr("obCardTitle")}</strong>
              <span className="onboard-progress">
                {onboardDone} / 3
              </span>
            </div>
            <button type="button" className="onboard-dismiss" onClick={dismissOnboard} aria-label="dismiss">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </div>
          <div className="onboard-steps">
            {onboardSteps.map((s) => (
              <button
                key={s.k}
                type="button"
                className={`onboard-step${s.done ? " done" : ""}`}
                disabled={s.done}
                onClick={() => setView(s.go)}
              >
                <span className="onboard-step-check">
                  <span className="material-symbols-outlined">{s.done ? "check_circle" : s.icon}</span>
                </span>
                <span className="onboard-step-lbl">{s.label}</span>
                {!s.done && (
                  <span className="material-symbols-outlined onboard-step-arrow">chevron_right</span>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="hub-live-block">
        <div className="section-head" style={{ marginBottom: 8 }}>
          <span className="section-label" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
            <span className="live-dot" />
            <span>{tr("liveActivity")}</span>
          </span>
        </div>
        <div className="hub-live-grid">
          <div className="stat-card hub-live-budget">
            <div className="stat-lbl">{tr("monthBudget")}</div>
            <div className="budget-ring-wrap">
              <svg className="ring-svg" viewBox="0 0 56 56">
                <circle className="ring-track" cx="28" cy="28" r="22" />
                <circle
                  className={`ring-fill${pct >= 0.8 ? " warn" : ""}`}
                  cx="28"
                  cy="28"
                  r="22"
                  strokeDasharray="138"
                  strokeDashoffset={ringOffset}
                />
              </svg>
              <div>
                <div className="budget-num mono">{fmtMoney(remain, lang)}</div>
                <div className="budget-sub">
                  <span>{tr("used")}</span>{" "}
                  <span className="mono">{fmtMoney(DEMO.BUDGET.used, lang)}</span> /{" "}
                  <span className="mono">{fmtMoney(DEMO.BUDGET.cap, lang)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="stat-card hub-live-spark">
            <div className="stat-lbl">{tr("tokenStream")}</div>
            <div className="spark-meta">
              <span className="spark-rate mono">{fmtRate(1240)}</span>
              <span style={{ fontSize: 10, color: "var(--on-surface-variant)" }}>live</span>
            </div>
            <svg className="spark-svg" viewBox="0 0 260 40">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="spark-area" d={sparkAreaPath(SPARK)} />
              <path className="spark-line" d={sparkPath(SPARK)} />
              <circle r="3" fill="var(--primary)" cx="260" cy={8} />
            </svg>
          </div>
          <div className="stat-card hub-live-apps">
            <div className="stat-lbl">{tr("connectedApps")}</div>
            {DEMO.APPS.filter((a) => a.status === "live").map((a) => (
              <div key={a.id} className="app-live">
                <div className="app-live-head">
                  <span>
                    <span className="app-dot" style={{ background: a.color }} />
                    {appName(lang, a)}
                  </span>
                  <span className="mono app-flow">{a.rate}/s</span>
                </div>
                <div className="app-bar">
                  <div className="app-bar-fill" style={{ width: `${a.share}%`, background: a.color }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="stat-card hub-live-log">
          <div className="stat-lbl">{tr("routeLog")}</div>
          <div className="route-log">
            {routeLines.map((line, i) => {
              const app = DEMO.APPS.find((a) => a.id === line.appId);
              if (!app) return null;
              return (
                <div key={i} className="route-line">
                  <span className="material-symbols-outlined" style={{ color: line.color }}>
                    {line.icon}
                  </span>
                  <span className="route-app">{appName(lang, app)}</span>
                  <span className="material-symbols-outlined">auto_awesome</span>
                  <span className="mono">{line.cost}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div className="savings-banner" style={{ marginTop: 10 }}>
          <span className="material-symbols-outlined">savings</span>
          <div>
            <div className="savings-big mono">{fmtMoney(DEMO.BUDGET.saved, lang)}</div>
            <div className="savings-sub">
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                compress
              </span>{" "}
              −34% ·{" "}
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                short_text
              </span>{" "}
              {fmtMoney(today.saveConcise, lang)} ·{" "}
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                auto_awesome
              </span>{" "}
              {fmtMoney(today.saveRoute, lang)}
            </div>
            <div className="failover-pill ok">
              <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                sync_alt
              </span>
              <span>{tr("actFailoverToday")}</span>
            </div>
          </div>
        </div>
      </div>

      {localMode && (
        <div className="mode-banner">
          <span className="material-symbols-outlined">offline_pin</span>
          <div>
            <strong>{tr("modeLocalTitle")}</strong>
            <span>{tr("modeLocalSub")}</span>
          </div>
        </div>
      )}

      <div className="grid-3">
        <div className="stat-card highlight">
          <div className="stat-lbl">{tr("savedToday")}</div>
          <div className="stat-val savings-text mono">{fmtMoney(DEMO.BUDGET.saved, lang)}</div>
          <div className="stat-foot">{tr("savedFoot")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("tokenToday")}</div>
          <div className="stat-val mono">{(DEMO.BUDGET.tokens / 1e6).toFixed(1)}M</div>
          <div className="stat-foot mono">{lang === "zh" ? "智能压缩 −34%" : "Smart compress −34%"}</div>
          <div className="stat-foot mono" style={{ marginTop: 2 }}>
            {lang === "zh" ? "简洁回复 −12%" : "Concise replies −12%"}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("budgetLeft")}</div>
          <div className="stat-val mono">{fmtMoney(remain, lang)}</div>
          <div className="stat-foot">
            <span>{tr("daysLeft")}</span>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 4 }}>
        <span className="section-label">{tr("bonusSectionTitle")}</span>
        <span style={{ fontSize: 11, color: "var(--on-surface-variant)", fontWeight: 400 }}>
          {tr("bonusSectionSub")}
        </span>
      </div>
      <div className="bonus-grid">
        {DEMO.BONUS_ITEMS.map((b) => (
          <div key={b.id} className={`bonus-card${b.on ? " on" : ""}${!b.on ? " soon" : ""}`}>
            <span className="material-symbols-outlined">{b.icon}</span>
            <strong>{b.name[lang]}</strong>
            <span className="bonus-sub">{b.sub[lang]}</span>
            <div className="bonus-meta">
              <span>{b.on ? tr("bonusOn") : tr("capSoon")}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2">
        <div className="stat-card">
          <div className="stat-lbl">{tr("spend7d")}</div>
          <div className="bar-chart">
            {BAR_VALS.map((v, i) => {
              const max = Math.max(...BAR_VALS);
              return (
                <div key={i} className="bar-col">
                  <div className={`bar${i === 6 ? " today" : ""}`} style={{ height: `${(v / max) * 72}px` }} />
                  <div className="bar-lbl">{days[i]}</div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("byApp")}</div>
          <div className="donut-row">
            <svg className="donut-svg" viewBox="0 0 72 72">
              <circle cx="36" cy="36" r="28" fill="none" stroke="var(--outline-variant)" strokeWidth="8" />
              <circle
                cx="36"
                cy="36"
                r="28"
                fill="none"
                stroke="var(--app-cursor)"
                strokeWidth="8"
                strokeDasharray="176"
                strokeDashoffset="100"
              />
            </svg>
            <div className="legend">
              {DEMO.APPS.filter((a) => a.share > 0).map((a) => (
                <div key={a.id} className="legend-item">
                  <span className="legend-dot" style={{ background: a.color }} />
                  {appName(lang, a)}
                  <span className="legend-pct mono">{a.share}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="section-head" style={{ marginTop: 8 }}>
        <span className="section-label">{tr("apiCapsTitle")}</span>
      </div>
      <p style={{ fontSize: 12, color: "var(--on-surface-variant)", margin: "-4px 0 12px", lineHeight: 1.5 }}>
        {tr("apiCapsSub")}
      </p>
      <div className="cap-grid">
        {DEMO.API_CAPS.map((c) => (
          <div key={c.id} className={`cap-card${c.on ? " on" : ""}`}>
            <span className="material-symbols-outlined">{c.icon}</span>
            <div className="cap-name">{c.name[lang]}</div>
            <div className="cap-sub">{c.sub[lang]}</div>
            <span className="cap-badge">{c.on ? tr("capOn") : tr("capSoon")}</span>
          </div>
        ))}
      </div>

      <div className="section-label">{tr("appTraffic")}</div>
      {DEMO.APPS.filter(isExternalApp).map((a) => (
        <div key={a.id} className="app-card">
          <div className="app-card-head">
            <div className="app-card-name">
              <span className="app-dot" style={{ background: a.color }} />
              {appName(lang, a)}
            </div>
            <span className={`app-status ${statusClass(a.status)}`}>{a.status === "live" ? "●" : "○"}</span>
          </div>
          <div className="app-card-meta">
            <div>
              {tr("flow")}
              <strong className="mono">{a.rate}/s</strong>
            </div>
            <div>
              {tr("todaySpend")}
              <strong className="mono">{fmtMoney(a.today, lang)}</strong>
            </div>
            <div>
              {tr("lastActive")}
              <strong>{a.lastSeen[lang]}</strong>
            </div>
          </div>
        </div>
      ))}
    </PageScroll>
  );
}
