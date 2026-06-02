import { useMemo, useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { emptyPeriodStats, loadBonusProfileLocal } from "../lib/bonusApi";
import { fmtMoney, fmtTokens } from "../lib/format";
import { appForLedgerSlug, appName } from "../lib/route";
import { aggregateBilling, type BillPath, type BillPeriod } from "../lib/usage/billing";
import { useApp } from "../state/AppContext";

export function BillingView() {
  const { lang, tr, localMode, usageSnapshot } = useApp();
  const [period, setPeriod] = useState<BillPeriod>("today");
  const [path, setPath] = useState<BillPath>("all");

  const base =
    period === "today"
      ? usageSnapshot?.periods?.today
      : period === "week"
        ? usageSnapshot?.periods?.week
        : usageSnapshot?.periods?.month;
  const periodStats = base ?? emptyPeriodStats();

  const p = useMemo(
    () => aggregateBilling(period, path, periodStats, usageSnapshot?.ledger),
    [period, path, periodStats, usageSnapshot?.ledger],
  );

  const ledgerRows = useMemo(() => {
    if (!usageSnapshot?.ledger?.length) return [];
    return usageSnapshot.ledger
      .filter((row) => {
        if (path === "hosted") return row.path === "hosted";
        if (path === "byok") return row.path === "byok";
        return true;
      })
      .slice(0, 30);
  }, [usageSnapshot, path]);

  const failoverOn = loadBonusProfileLocal().failover;
  const failoverLabel =
    p.reqs > 0 && failoverOn
      ? lang === "zh"
        ? `限流自动换路已开启 · 本页 ${p.reqs} 次请求`
        : `Auto failover on · ${p.reqs} requests in view`
      : tr("billFailoverIdle");

  return (
    <PageScroll>
      <PageHead
        title={tr("navBilling")}
        compact
        extra={
          <div className="bill-tabs">
            {(["today", "week", "month"] as const).map((per) => (
              <button
                key={per}
                type="button"
                className={`bill-tab${period === per ? " active" : ""}`}
                onClick={() => setPeriod(per)}
              >
                {tr(per === "today" ? "periodToday" : per === "week" ? "periodWeek" : "periodMonth")}
              </button>
            ))}
          </div>
        }
      />

      <div className="bill-path-tabs">
        {(
          [
            ["all", "billPathAll"],
            ...(!localMode ? ([["hosted", "billPathHosted"]] as const) : []),
            ["byok", "billPathByok"],
          ] as const
        ).map(([id, key]) => (
          <button
            key={id}
            type="button"
            className={`bill-path-tab${path === id ? " active" : ""}`}
            onClick={() => setPath(id)}
          >
            {tr(key)}
          </button>
        ))}
      </div>

      <div className="bill-hero">
        <div className="stat-card">
          <div className="stat-lbl">{tr("billSpend")}</div>
          <div className="stat-val mono">{fmtMoney(p.spend, lang)}</div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-lbl">{tr("savedToday")}</div>
          <div className="stat-val savings-text mono">{fmtMoney(p.saved, lang)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("billTokens")}</div>
          <div className="stat-val mono">{fmtTokens(p.tokens)}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("billReqs")}</div>
          <div className="stat-val mono">{p.reqs}</div>
        </div>
      </div>

      <div className="stat-card" style={{ marginBottom: 12 }}>
        <div className="section-head" style={{ margin: "0 0 8px" }}>
          <span className="section-label" style={{ margin: 0, display: "flex", alignItems: "center", gap: 6 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              psychology
            </span>
            <span>{tr("byModel")}</span>
          </span>
        </div>
        {p.models.length === 0 ? (
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)", margin: 0 }}>{tr("gwWaiting")}</p>
        ) : (
          <>
            <div className="model-stack">
              {p.models.map((m) => (
                <div
                  key={m.id}
                  className="model-stack-seg"
                  style={{ width: `${Math.max(m.pct, 4)}%`, background: "var(--primary-container)" }}
                />
              ))}
            </div>
            {p.models.map((m) => (
              <div key={m.id} className="model-row">
                <span>{m.id}</span>
                <span className="mono">{m.pct}%</span>
                <span className="mono">{fmtMoney(m.amount, lang)}</span>
              </div>
            ))}
          </>
        )}
      </div>

      <div className="section-head">
        <span className="section-label" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            savings
          </span>
          <span>{tr("savingsSplit")}</span>
        </span>
      </div>
      <div className="grid-bonus-save">
        <div className="stat-card">
          <div className="stat-lbl">{tr("compressLbl")}</div>
          <div className="stat-val savings-text mono" style={{ fontSize: 20 }}>
            {fmtMoney(p.saveCompress, lang)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("conciseLbl")}</div>
          <div className="stat-val savings-text mono" style={{ fontSize: 20 }}>
            {fmtMoney(p.saveConcise, lang)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("routeLbl")}</div>
          <div className="stat-val savings-text mono" style={{ fontSize: 20 }}>
            {fmtMoney(p.saveRoute, lang)}
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("pruneLbl")}</div>
          <div className="stat-val savings-text mono" style={{ fontSize: 20 }}>
            {fmtMoney(p.savePrune, lang)}
          </div>
        </div>
        <div className="stat-card highlight">
          <div className="stat-lbl">{tr("total")}</div>
          <div className="stat-val savings-text mono">{fmtMoney(p.saved, lang)}</div>
        </div>
      </div>
      <div className="failover-pill ok" style={{ marginTop: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          sync_alt
        </span>
        <span>{failoverLabel}</span>
      </div>

      <div className="section-head" style={{ marginTop: 16 }}>
        <span className="section-label">{tr("recentBills")}</span>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{tr("colTime")}</th>
              <th>{tr("colApp")}</th>
              <th>{tr("colModel")}</th>
              <th>{tr("colTokens")}</th>
              <th>{tr("colCost")}</th>
            </tr>
          </thead>
          <tbody>
            {ledgerRows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
                  {tr("gwWaiting")}
                </td>
              </tr>
            ) : (
              ledgerRows.map((row, i) => {
                const app = appForLedgerSlug(row.app_slug);
                const time = new Date(row.ts_ms).toLocaleTimeString(lang === "zh" ? "zh-CN" : "en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                return (
                  <tr key={i}>
                    <td className="mono">{time}</td>
                    <td>{appName(lang, app)}</td>
                    <td className="mono">{row.model}</td>
                    <td className="mono">{(row.prompt_tokens + row.completion_tokens).toLocaleString()}</td>
                    <td className="mono">{fmtMoney(row.cost_yuan, lang)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </PageScroll>
  );
}
