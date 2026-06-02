import { useMemo, useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { emptyPeriodStats } from "../lib/bonusApi";
import { fmtMoney, fmtTokens } from "../lib/format";
import { appForLedgerSlug, appName } from "../lib/route";
import { useApp } from "../state/AppContext";

type Period = "today" | "week" | "month";
type BillPath = "all" | "hosted" | "byok";

function scalePeriod<T extends { spend_yuan: number; tokens: number; requests: number }>(
  stats: T,
  scale: number,
): T {
  if (scale === 1) return stats;
  return {
    ...stats,
    spend_yuan: stats.spend_yuan * scale,
    tokens: Math.round(stats.tokens * scale),
    requests: Math.round(stats.requests * scale),
  };
}

export function BillingView() {
  const { lang, tr, localMode, usageSnapshot } = useApp();
  const [period, setPeriod] = useState<Period>("today");
  const [path, setPath] = useState<BillPath>("all");

  const raw =
    period === "today"
      ? usageSnapshot?.periods?.today
      : period === "week"
        ? usageSnapshot?.periods?.week
        : usageSnapshot?.periods?.month;
  const base = raw ?? emptyPeriodStats();

  const scale = path === "hosted" ? 0.65 : path === "byok" ? 0.35 : 1;
  const p = useMemo(() => {
    const scaled = scalePeriod(base, scale);
    const models = base.by_model.map((m) => ({
      id: m.model,
      pct: base.spend_yuan > 0 ? Math.round((m.amount_yuan / base.spend_yuan) * 100) : 0,
      amount: m.amount_yuan * scale,
      tokens: Math.round(m.tokens * scale),
      reqs: Math.round(m.requests * scale),
    }));
    return {
      spend: scaled.spend_yuan,
      saved: scaled.saved_yuan,
      tokens: scaled.tokens,
      reqs: scaled.requests,
      saveCompress: scaled.save_compress_yuan,
      saveConcise: scaled.save_concise_yuan,
      saveRoute: scaled.save_route_yuan,
      models,
    };
  }, [base, scale]);

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
        <div className="stat-card highlight">
          <div className="stat-lbl">{tr("total")}</div>
          <div className="stat-val savings-text mono">{fmtMoney(p.saved, lang)}</div>
        </div>
      </div>
      <div className="failover-pill ok" style={{ marginTop: 10 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          sync_alt
        </span>
        <span>{tr("billFailoverOk")}</span>
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
