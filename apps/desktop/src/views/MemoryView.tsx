import { useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { useApp } from "../state/AppContext";
import type { MemoryTag } from "../lib/memoryStore";

const TAG_KEYS = {
  pref: "tagPref",
  project: "tagProject",
  fact: "tagFact",
} as const;

export function MemoryView() {
  const { lang, tr, memories, addMemoryManual } = useApp();
  const [draft, setDraft] = useState("");
  const [tag, setTag] = useState<MemoryTag>("pref");
  const [adding, setAdding] = useState(false);

  const submit = () => {
    if (!draft.trim()) return;
    addMemoryManual(draft, tag);
    setDraft("");
    setAdding(false);
  };

  return (
    <PageScroll>
      <PageHead title={tr("navMemory")} subtitle={tr("memorySub")} />
      <div
        className="stat-card"
        style={{ marginBottom: 16, fontSize: 12, color: "var(--on-surface-variant)", lineHeight: 1.6 }}
      >
        {tr("memoryNote")}
      </div>
      {memories.map((m) => (
        <div key={m.id} className="memory-item stat-card" style={{ marginBottom: 10 }}>
          <span className="memory-tag">{tr(TAG_KEYS[m.tag])}</span>
          <p style={{ fontSize: 14, marginTop: 8 }}>{m.text[lang]}</p>
          <p style={{ fontSize: 11, color: "var(--on-surface-variant)", marginTop: 8 }}>
            {m.from[lang]} · {m.time}
          </p>
        </div>
      ))}
      {adding ? (
        <div className="stat-card" style={{ marginTop: 8 }}>
          <select value={tag} onChange={(e) => setTag(e.target.value as MemoryTag)} style={{ marginBottom: 8 }}>
            <option value="pref">{tr("tagPref")}</option>
            <option value="project">{tr("tagProject")}</option>
            <option value="fact">{tr("tagFact")}</option>
          </select>
          <textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={tr("composerPh")} />
          <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
            <button type="button" className="btn-outlined" onClick={() => setAdding(false)}>
              {tr("connectLater")}
            </button>
            <button type="button" className="modal-done" style={{ margin: 0, flex: 1 }} onClick={submit}>
              {tr("memoryAdd")}
            </button>
          </div>
        </div>
      ) : (
        <button className="btn-add-app" type="button" style={{ marginTop: 8 }} onClick={() => setAdding(true)}>
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            add
          </span>
          <span>{tr("memoryAdd")}</span>
        </button>
      )}
    </PageScroll>
  );
}
