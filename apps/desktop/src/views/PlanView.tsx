import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { fmtMoney } from "../lib/format";
import { isTrialPlan, planAllowance, PRODUCT_PLANS, resolvePlanId } from "../lib/product/plans";
import type { I18nKey } from "../i18n";
import { useApp } from "../state/AppContext";

export function PlanView() {
  const { lang, tr, showToast, cloudUser, usageSnapshot } = useApp();
  const planId = resolvePlanId(cloudUser?.plan);
  const cap = usageSnapshot?.budget?.cap_yuan ?? planAllowance(cloudUser?.plan);
  const used = usageSnapshot?.budget?.used_yuan ?? usageSnapshot?.periods?.month?.spend_yuan ?? 0;
  const saved = usageSnapshot?.periods?.month?.saved_yuan ?? 0;
  const usedPct = cap > 0 ? Math.min((used / cap) * 100, 100) : 0;
  const proPrice = PRODUCT_PLANS.find((p) => p.id === "pro")?.price ?? 29;
  const net = saved - proPrice;

  return (
    <PageScroll>
      <PageHead title={tr("planTitle")} subtitle={tr("planSub")} />
      <div className="biz-roi">
        <div className="stat-card highlight">
          <div className="stat-lbl">{tr("planRoiSaved")}</div>
          <div className="stat-val savings-text mono">{fmtMoney(saved, lang)}</div>
          <div className="stat-foot">{tr("planRoiFoot")}</div>
        </div>
        <div className="stat-card">
          <div className="stat-lbl">{tr("planNetLbl")}</div>
          <div className="stat-val savings-text mono">
            {net >= 0 ? "+" : ""}
            {fmtMoney(net, lang)}
          </div>
        </div>
      </div>
      <div className="stat-card" style={{ marginBottom: 16 }}>
        <div className="stat-lbl">{tr("planAllowance")}</div>
        <div className="stat-val mono" style={{ fontSize: 18 }}>
          {fmtMoney(used, lang)} / {fmtMoney(cap, lang)}
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
        {PRODUCT_PLANS.map((plan) => {
          const isCurrent = plan.id === planId;
          const onTrial = isCurrent && isTrialPlan(cloudUser?.plan);
          return (
            <div key={plan.id} className={`plan-card${plan.featured ? " featured" : ""}`}>
              <div className="plan-card-head">
                <strong>{tr(plan.id === "free" ? "planFree" : plan.id === "pro" ? "planPro" : "planTeam")}</strong>
                {isCurrent && (
                  <span className="plan-badge">{onTrial ? tr("planTrial") : tr("planCur")}</span>
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
                onClick={() => showToast(isCurrent ? tr("planCur") : tr("planUpgrade"))}
              >
                {isCurrent ? tr("planCur") : plan.id === "team" ? tr("planContact") : tr("planUpgrade")}
              </button>
            </div>
          );
        })}
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
