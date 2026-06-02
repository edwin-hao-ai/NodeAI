import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { useApp } from "../state/AppContext";

const HOSTED_SOURCE = {
  id: "nodeai",
  name: { zh: "NodeAI 含额度", en: "NodeAI allowance" },
  url: "gateway://nodeai",
  status: { zh: "正常 · 经云端", en: "OK · via cloud" },
};

export function SourcesView() {
  const { lang, tr, modelSources, setSourceModalOpen } = useApp();

  const allSources = [
    {
      id: HOSTED_SOURCE.id,
      name: HOSTED_SOURCE.name[lang],
      url: HOSTED_SOURCE.url,
      path: "hosted" as const,
      status: HOSTED_SOURCE.status[lang],
    },
    ...modelSources.map((s) => ({
      id: s.id,
      name: s.name,
      url: s.url,
      path: "local" as const,
      status: lang === "zh" ? "本地直连" : "Local direct",
    })),
  ];

  return (
    <PageScroll>
      <PageHead title={tr("navSources")} subtitle={tr("sourcesSub")} />
      <div className="stat-card" style={{ marginBottom: 12, fontSize: 12, lineHeight: 1.6 }}>
        <div style={{ fontWeight: 500, marginBottom: 4 }}>{tr("pathDiagramTitle")}</div>
        <div style={{ color: "var(--on-surface-variant)", marginBottom: 8 }}>{tr("billPathNoteAll")}</div>
        <div style={{ marginBottom: 10 }}>
          <span className="path-badge cloud">{tr("pathDiagramHosted")}</span>
          <div className="path-diagram-row">
            <span className="path-diagram-node">8787</span>
            <span className="path-diagram-arrow">→</span>
            <span className="path-diagram-node">NodeAI</span>
            <span className="path-diagram-arrow">→</span>
            <span className="path-diagram-node">Gateway</span>
          </div>
        </div>
        <div>
          <span className="path-badge local">{tr("pathDiagramByok")}</span>
          <div className="path-diagram-row">
            <span className="path-diagram-node">8787</span>
            <span className="path-diagram-arrow">→</span>
            <span className="path-diagram-node">{lang === "zh" ? "本机处理" : "On device"}</span>
            <span className="path-diagram-arrow">→</span>
            <span className="path-diagram-node">{lang === "zh" ? "模型服务商" : "Your provider"}</span>
          </div>
        </div>
      </div>
      {allSources.map((s) => (
        <div key={s.id} className="stat-card" style={{ marginBottom: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{s.name}</strong>
            <span className={`path-badge ${s.path === "hosted" ? "cloud" : "local"}`}>
              {s.path === "hosted" ? tr("pathCloudShort") : tr("pathLocalShort")}
            </span>
          </div>
          <p className="mono" style={{ fontSize: 12, color: "var(--secondary)", marginTop: 6 }}>
            {s.url}
          </p>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginTop: 6 }}>{s.status}</p>
        </div>
      ))}
      <button className="btn-add-app" type="button" style={{ marginTop: 8 }} onClick={() => setSourceModalOpen(true)}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          add
        </span>
        <span>{tr("addApp")}</span>
      </button>
    </PageScroll>
  );
}
