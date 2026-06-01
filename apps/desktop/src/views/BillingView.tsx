import { useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { DEMO } from "../data/demo";
import { fmtMoney, fmtTokens } from "../lib/format";
import { appName } from "../lib/route";
import { useApp } from "../state/AppContext";

type Period = "today" | "week" | "month";
type BillPath = "all" | "hosted" | "byok";

export function BillingView() {
  const { lang, tr, localMode } = useApp();
  const [period, setPeriod] = useState<Period>("today");
  const [path, setPath] = useState<BillPath>("all");

  const raw = DEMO.BILL_PERIODS[period];
  const scale = path === "hosted" ? 0.65 : path === "byok" ? 0.35 : 1;
  const p = {
    ...raw,
    spend: raw.spend * scale,
    saved: raw.saved * scale,
    tokens: Math.round(raw.tokens * scale),
    reqs: Math.round(raw.reqs * scale),
    saveCompress: raw.saveCompress * scale,
    saveConcise: raw.saveConcise * scale,
    saveRoute: raw.saveRoute * scale,
  };

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
        <div className="model-stack">
          {p.models.map((m) => (
            <div
              key={m.id}
              className="model-stack-seg"
              style={{ width: `${m.pct}%`, background: "var(--primary-container)" }}
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
            {DEMO.BILL_LEDGER.map((row, i) => {
              const app = DEMO.APPS.find((a) => a.id === row.appId);
              return (
                <tr key={i}>
                  <td className="mono">{row.time}</td>
                  <td>{app ? appName(lang, app) : row.appId}</td>
                  <td className="mono">{row.modelId}</td>
                  <td className="mono">{row.tokens.toLocaleString()}</td>
                  <td className="mono">{fmtMoney(row.cost, lang)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PageScroll>
  );
}
