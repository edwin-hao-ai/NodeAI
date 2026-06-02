import { useEffect, useMemo } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { emptyPeriodStats } from "../lib/bonusApi";
import { BONUS_CARDS } from "../lib/product/bonusCards";
import { loadBonusProfileLocal } from "../lib/bonusApi";
import { fmtMoney, fmtRate, sparkAreaPath, sparkPath } from "../lib/format";
import {
  appName,
  dailySpendBars,
  isExternalApp,
  lastSeenLabel,
  liveAppsFromUsage,
  recentRouteLines,
  sparklineFromLedger,
} from "../lib/route";
import { useApp } from "../state/AppContext";

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
    viewSavingsDone,
    markViewSavings,
    onboardDismissed,
    dismissOnboard,
    usageSnapshot,
  } = useApp();

  const bonusProfile = loadBonusProfileLocal();
  const today = usageSnapshot?.periods?.today ?? emptyPeriodStats();
  const budget = usageSnapshot?.budget;
  const cap = budget?.cap_yuan ?? 48;
  const used = budget?.used_yuan ?? today.spend_yuan;
  const pct = cap > 0 ? used / cap : 0;
  const ringOffset = 138 * (1 - Math.min(pct, 1));
  const remain = Math.max(cap - used, 0);
  const liveSaved = today.saved_yuan;
  const liveApps = liveAppsFromUsage(usageSnapshot);
  const routeLines = recentRouteLines(usageSnapshot, lang);
  const spark = sparklineFromLedger(usageSnapshot);
  const barVals = dailySpendBars(usageSnapshot);
  const days =
    lang === "zh"
      ? ["一", "二", "三", "四", "五", "六", "日"]
      : ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  const liveCompressPct =
    usageSnapshot?.bonus?.rtk_tokens_saved && usageSnapshot.bonus.rtk_requests
      ? Math.min(
          40,
          Math.round(
            (usageSnapshot.bonus.rtk_tokens_saved /
              Math.max(usageSnapshot.bonus.rtk_requests * 200, 1)) *
              100,
          ),
        )
      : 0;

  useEffect(() => {
    markViewSavings();
  }, [markViewSavings]);

  const onboardSteps = useMemo(() => {
    const steps = [
      { id: "chat", done: firstChatDone, label: tr("obStep1") },
      { id: "savings", done: viewSavingsDone, label: tr("obStep2") },
      {
        id: "connect",
        done: cursorConnected || localMode,
        label: tr("obStep3"),
      },
    ];
    const doneCount = steps.filter((s) => s.done).length;
    return { steps, doneCount, total: steps.length };
  }, [firstChatDone, viewSavingsDone, cursorConnected, localMode, tr]);

  const externalLive = liveApps.filter((a) => isExternalApp(a) && a.status === "live");
  const tokenRate =
    today.requests > 0 ? Math.round(today.tokens / Math.max(today.requests, 1)) : 0;

  return (
    <PageScroll>
      <PageHead title={tr("hubTitle")} subtitle={tr("appsSub")} />

      {!onboardDismissed && onboardSteps.doneCount < onboardSteps.total && (
        <div className="onboard-card">
          <div className="onboard-head">
            <strong>{tr("obCardTitle")}</strong>
            <button type="button" className="onboard-dismiss" onClick={dismissOnboard}>
              {tr("connectLater")}
            </button>
          </div>
          <div className="onboard-steps">
            {onboardSteps.steps.map((s) => (
              <div key={s.id} className={`onboard-step${s.done ? " done" : ""}`}>
                <span className="material-symbols-outlined">{s.done ? "check_circle" : "radio_button_unchecked"}</span>
                <span>{s.label}</span>
              </div>
            ))}
          </div>
          <div className="onboard-progress">
            {onboardSteps.doneCount}/{onboardSteps.total}
          </div>
        </div>
      )}

      <div className="hub-live-grid">
        <div className="hub-live-row">
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
                  <span className="mono">{fmtMoney(used, lang)}</span> /{" "}
                  <span className="mono">{fmtMoney(cap, lang)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className="stat-card hub-live-spark">
            <div className="stat-lbl">{tr("tokenStream")}</div>
            <div className="spark-meta">
              <span className="spark-rate mono">{fmtRate(tokenRate)}</span>
              <span style={{ fontSize: 10, color: "var(--on-surface-variant)" }}>
                {today.requests > 0 ? "live" : "—"}
              </span>
            </div>
            <svg className="spark-svg" viewBox="0 0 260 40">
              <defs>
                <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path className="spark-area" d={sparkAreaPath(spark)} />
              <path className="spark-line" d={sparkPath(spark)} />
              {spark.some((v) => v > 0) && (
                <circle r="3" fill="var(--primary)" cx="260" cy={8} />
              )}
            </svg>
          </div>
          <div className="stat-card hub-live-apps">
            <div className="stat-lbl">{tr("connectedApps")}</div>
            {liveApps.filter((a) => a.status === "live").length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)", margin: 0 }}>
                {tr("gwWaiting")}
              </p>
            ) : (
              liveApps
                .filter((a) => a.status === "live")
                .map((a) => (
                  <div key={a.id} className="app-live">
                    <div className="app-live-head">
                      <span>
                        <span className="app-dot" style={{ background: a.color }} />
                        {appName(lang, a)}
                      </span>
                      <span className="mono app-flow">{a.requests} req</span>
                    </div>
                    <div className="app-bar">
                      <div
                        className="app-bar-fill"
                        style={{ width: `${a.share}%`, background: a.color }}
                      />
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
        <div className="stat-card hub-live-log">
          <div className="stat-lbl">{tr("routeLog")}</div>
          <div className="route-log">
            {routeLines.length === 0 ? (
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)", margin: 0 }}>
                {tr("gwWaiting")}
              </p>
            ) : (
              routeLines.map((line, i) => {
                const app = liveApps.find((a) => a.id === line.appId);
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
              })
            )}
          </div>
        </div>
        <div className="savings-banner" style={{ marginTop: 10 }}>
          <span className="material-symbols-outlined">savings</span>
          <div>
            <div className="savings-big mono">{fmtMoney(liveSaved, lang)}</div>
            <div className="savings-sub">
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                compress
              </span>{" "}
              {liveCompressPct > 0 ? `−${liveCompressPct}%` : "—"} ·{" "}
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                short_text
              </span>{" "}
              {fmtMoney(today.save_concise_yuan, lang)} ·{" "}
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                auto_awesome
              </span>{" "}
              {fmtMoney(today.save_route_yuan, lang)} ·{" "}
              <span className="material-symbols-outlined" style={{ fontSize: 12, verticalAlign: -2 }}>
                content_cut
              </span>{" "}
              {fmtMoney(today.save_prune_yuan ?? 0, lang)}
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
        <div className="mode-banner show">
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
          <div className="stat-val savings-text mono">{fmtMoney(liveSaved, lang)}</div>
          <div className="stat-foot">{tr("savedFoot")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("tokenToday")}</div>
          <div className="stat-val mono">{(today.tokens / 1e6).toFixed(2)}M</div>
          <div className="stat-foot mono">
            {liveCompressPct > 0
              ? lang === "zh"
                ? `智能压缩 −${liveCompressPct}%`
                : `Smart compress −${liveCompressPct}%`
              : tr("gwWaiting")}
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
        {BONUS_CARDS.map((b) => {
          const on = b.soon ? false : b.isOn(bonusProfile);
          return (
            <div key={b.id} className={`bonus-card${on ? " on" : ""}${b.soon ? " soon" : ""}`}>
              <span className="material-symbols-outlined">{b.icon}</span>
              <strong>{b.name[lang]}</strong>
              <span className="bonus-sub">{b.sub[lang]}</span>
              <div className="bonus-meta">
                <span>{on ? tr("bonusOn") : tr("capSoon")}</span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2">
        <div className="stat-card">
          <div className="stat-lbl">{tr("spend7d")}</div>
          <div className="bar-chart">
            {barVals.map((v, i) => {
              const max = Math.max(...barVals, 1);
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
          {externalLive.length === 0 ? (
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("gwWaiting")}</p>
          ) : (
            <div className="donut-row">
              <svg className="donut-svg" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="28" fill="none" stroke="var(--outline-variant)" strokeWidth="8" />
                {externalLive.map((a, i) => (
                  <circle
                    key={a.id}
                    cx="36"
                    cy="36"
                    r="28"
                    fill="none"
                    stroke={a.color.startsWith("var") ? "var(--primary)" : a.color}
                    strokeWidth="8"
                    strokeDasharray="176"
                    strokeDashoffset={176 - (176 * a.share) / 100}
                    transform={`rotate(${i * 40} 36 36)`}
                  />
                ))}
              </svg>
              <div className="legend">
                {externalLive.map((a) => (
                  <div key={a.id} className="legend-item">
                    <span className="legend-dot" style={{ background: a.color }} />
                    {appName(lang, a)}
                    <span className="legend-pct mono">{a.share}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="section-label">{tr("appTraffic")}</div>
      {liveApps.filter(isExternalApp).map((a) => (
        <div key={a.id} className="app-card">
          <div className="app-card-head">
            <div className="app-card-name">
              <span className="app-dot" style={{ background: a.color }} />
              {appName(lang, a)}
            </div>
            <span className={`app-status ${statusClass(a.status)}`}>
              {a.status === "live" ? "●" : "○"}
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
              {tr("lastActive")}
              <strong>{lastSeenLabel(lang, a)}</strong>
            </div>
          </div>
        </div>
      ))}

      {!usageSnapshot && (
        <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginTop: 12 }}>
          {tr("gwWaiting")}
        </p>
      )}
    </PageScroll>
  );
}
