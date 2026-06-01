import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { DEMO } from "../data/demo";
import { fmtMoney } from "../lib/format";
import type { I18nKey } from "../i18n";
import { useApp } from "../state/AppContext";

export function PlanView() {
  const { lang, tr, showToast } = useApp();
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
      <div className="section-head">
        <span className="section-label">{tr("planCompare")}</span>
      </div>
      <div className="plan-grid">
        {DEMO.PLANS.map((plan) => (
          <div key={plan.id} className={`plan-card${plan.featured ? " featured" : ""}`}>
            <div className="plan-card-head">
              <strong>{tr(plan.id === "free" ? "planFree" : plan.id === "pro" ? "planPro" : "planTeam")}</strong>
              {plan.current && (
                <span className="plan-badge">{("trial" in plan && plan.trial) ? tr("planTrial") : tr("planCur")}</span>
              )}
            </div>
            <div className="plan-price">
              ¥{plan.price}
              <small>{tr("perMo")}</small>
            </div>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginBottom: 8 }}>
              {tr(plan.id === "free" ? "planFreeD" : plan.id === "pro" ? "planProD" : "planTeamD")}
            </p>
            <ul className="plan-features">
              {plan.feats.map((f) => (
                <li key={f}>
                  <span className="material-symbols-outlined">check_circle</span>
                  {tr(f as I18nKey)}
                </li>
              ))}
            </ul>
            <button
              type="button"
              className="plan-cta"
              onClick={() => showToast(`${tr("planUpgrade")} (demo)`)}
            >
              {plan.current ? tr("planCur") : plan.id === "team" ? tr("planContact") : tr("planUpgrade")}
            </button>
          </div>
        ))}
      </div>
      <div
        className="stat-card"
        style={{ marginTop: 16, fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6 }}
      >
        {tr("planBizNote")}
      </div>
    </PageScroll>
  );
}
