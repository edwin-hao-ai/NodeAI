import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { DEMO } from "../data/demo";
import { fmtMoney } from "../lib/format";
import { useApp } from "../state/AppContext";

export function PlanView() {
  const { lang, tr } = useApp();
  const usedPct = (DEMO.BUDGET.used / DEMO.BUDGET.cap) * 100;

  return (
    <PageScroll>
      <PageHead title={tr("planTitle")} subtitle={tr("planSub")} />
      <div className="biz-roi">
        <div className="stat-card highlight">
          <div className="stat-lbl">{tr("planRoiSaved")}</div>
          <div className="stat-val savings-text mono">{fmtMoney(DEMO.BUDGET.saved, lang)}</div>
          <div className="stat-foot">{tr("planRoiFoot")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("planNetLbl")}</div>
          <div className="stat-val savings-text mono">+¥191</div>
        </div>
      </div>
      <div className="stat-card" style={{ marginBottom: 16 }}>
        <div className="stat-lbl">{tr("planAllowance")}</div>
        <div className="stat-val mono" style={{ fontSize: 18 }}>
          {fmtMoney(DEMO.BUDGET.used, lang)} / {fmtMoney(DEMO.BUDGET.cap, lang)}
        </div>
        <div className="allowance-bar">
          <div className="allowance-fill" style={{ width: `${usedPct}%` }} />
        </div>
        <div className="stat-foot" style={{ marginTop: 8 }}>
          {tr("planAllowFoot")}
        </div>
      </div>
      <div
        className="stat-card"
        style={{ marginBottom: 16, fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6 }}
      >
        {tr("planBizNote")}
      </div>
    </PageScroll>
  );
}
