import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { DEMO } from "../data/demo";
import { useApp } from "../state/AppContext";

const TAG_KEYS = {
  pref: "tagPref",
  project: "tagProject",
  fact: "tagFact",
} as const;

export function MemoryView() {
  const { lang, tr } = useApp();

  return (
    <PageScroll>
      <PageHead title={tr("navMemory")} subtitle={tr("memorySub")} />
      <div
        className="stat-card"
        style={{ marginBottom: 16, fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6 }}
      >
        {tr("memoryNote")}
      </div>
      {DEMO.MEMORIES.map((m, i) => (
        <div key={i} className="memory-item stat-card" style={{ marginBottom: 10 }}>
          <span className="memory-tag">{tr(TAG_KEYS[m.tag as keyof typeof TAG_KEYS])}</span>
          <p style={{ fontSize: 14, marginTop: 8 }}>{m.text[lang]}</p>
          <p style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8 }}>
            {m.from[lang]} · {m.time}
          </p>
        </div>
      ))}
      <button className="btn-add-app" type="button" style={{ marginTop: 8 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
          add
        </span>
        <span>{tr("memoryAdd")}</span>
      </button>
    </PageScroll>
  );
}
