import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { DEMO } from "../data/demo";
import { useApp } from "../state/AppContext";

export function SourcesView() {
  const { lang, tr } = useApp();

  return (
    <PageScroll>
      <PageHead title={tr("navSources")} subtitle={tr("sourcesSub")} />
      {DEMO.SOURCES.map((s) => (
        <div key={s.id} className="stat-card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{s.name[lang]}</strong>
            <span className="path-badge">{s.path === "hosted" ? tr("pathCloudShort") : tr("pathLocalShort")}</span>
          </div>
          <p className="mono" style={{ fontSize: 12, color: "var(--secondary)", marginTop: 6 }}>
            {s.url}
          </p>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginTop: 6 }}>{s.status[lang]}</p>
        </div>
      ))}
      <button className="btn-add-app" type="button">
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          add
        </span>
        <span>{tr("sourceAdd")}</span>
      </button>
      <div className="privacy-callout" style={{ marginTop: 16 }}>
        <strong>{tr("byokPrivacyTitle")}</strong>
        <span>{tr("byokPrivacyBody")}</span>
      </div>
      <div
        className="stat-card"
        style={{ marginTop: 12, fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6 }}
      >
        {tr("sourcesNote")}
      </div>
      <div className="section-head" style={{ marginTop: 16 }}>
        <span className="section-label">{tr("fallbackHostedTitle")}</span>
      </div>
      <div className="fallback-tier cloud-tier">
        <strong>{tr("fbTier1")}</strong>
        <span>{tr("fbTier1Sub")}</span>
      </div>
      <div className="fallback-tier cloud-tier">
        <strong>{tr("fbTier3")}</strong>
        <span>{tr("fbTier3Sub")}</span>
      </div>
      <div className="section-head" style={{ marginTop: 12 }}>
        <span className="section-label">{tr("fallbackByokTitle")}</span>
      </div>
      <div className="fallback-tier local-tier">
        <strong>{tr("fbTier2")}</strong>
        <span>{tr("fbTier2Sub")}</span>
      </div>
      <div className="fallback-tier local-tier">
        <strong>{tr("fbTierByok2")}</strong>
        <span>{tr("fbTierByok2Sub")}</span>
      </div>
    </PageScroll>
  );
}
