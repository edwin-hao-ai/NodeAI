import { useState } from "react";
import { Modal } from "./ui/Modal";
import { saveSourceKey, testSourceUrl } from "../lib/sourceKeys";
import { useApp } from "../state/AppContext";

interface SourceModalProps {
  open: boolean;
  onClose: () => void;
}

export function SourceModal({ open, onClose }: SourceModalProps) {
  const { tr, addModelSource, showToast, lang } = useApp();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("https://api.openai.com/v1");
  const [key, setKey] = useState("");
  const [format, setFormat] = useState("openai");
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setName("");
    setUrl("https://api.openai.com/v1");
    setKey("");
    setFormat("openai");
  };

  const close = () => {
    reset();
    onClose();
  };

  const save = async () => {
    if (!name.trim() || !url.trim()) return;
    const id = `src-${Date.now()}`;
    setBusy(true);
    try {
      if (key.trim()) {
        await saveSourceKey(id, key.trim());
      }
      addModelSource({
        id,
        name: name.trim(),
        url: url.trim(),
        format,
        hasKey: Boolean(key.trim()),
      });
      showToast(tr("toastSourceSaved"));
      close();
    } catch (err) {
      showToast(String(err));
    } finally {
      setBusy(false);
    }
  };

  const test = async () => {
    if (!url.trim()) return;
    if (!key.trim()) {
      showToast(lang === "zh" ? "请先填写 API Key" : "Enter an API key first");
      return;
    }
    setBusy(true);
    try {
      const status = await testSourceUrl(url.trim(), key.trim());
      showToast(
        lang === "zh" ? `连接成功（HTTP ${status}）` : `Connected (HTTP ${status})`,
      );
    } catch (err) {
      showToast(String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open={open} onClose={close} sheetClassName="">
      <div className="modal-head">
        <h3>{tr("sourceModalTitle")}</h3>
        <button className="modal-close" type="button" onClick={close}>
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="form-inline">
        <div>
          <label style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("sourceName")}</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="My DeepSeek" />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("sourceUrl")}</label>
          <input type="url" value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("sourceKey")}</label>
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-..." />
        </div>
        <div>
          <label style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("sourceFormat")}</label>
          <select value={format} onChange={(e) => setFormat(e.target.value)}>
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic</option>
            <option value="gemini">Gemini</option>
          </select>
        </div>
        <p style={{ fontSize: 11, color: "var(--on-surface-variant)", lineHeight: 1.5, margin: 0 }}>
          {tr("sourceKeyHint")}
        </p>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
        <button className="btn-outlined" type="button" style={{ flex: 1 }} onClick={() => void test()} disabled={busy}>
          {tr("sourceTest")}
        </button>
        <button
          className="modal-done"
          type="button"
          style={{ flex: 1, margin: 0 }}
          onClick={() => void save()}
          disabled={busy}
        >
          {tr("sourceSave")}
        </button>
      </div>
    </Modal>
  );
}
