import { useState } from "react";
import { copyText } from "./ui/CopyButton";
import { Modal } from "./ui/Modal";
import { APP_TEMPLATES } from "../lib/product/apps";
import { useApp } from "../state/AppContext";

interface AddAppModalProps {
  open: boolean;
  onClose: () => void;
}

type AppTemplate = (typeof APP_TEMPLATES)[number];

export function AddAppModal({ open, onClose }: AddAppModalProps) {
  const { lang, tr, gatewayBaseUrl, showToast } = useApp();
  const [picked, setPicked] = useState<AppTemplate | null>(null);

  const close = () => {
    setPicked(null);
    onClose();
  };

  const slug = picked?.id ?? "app";
  const accessCode = `sk-nodeai-${slug}`;

  const copy = async (text: string) => {
    await copyText(text);
    showToast(tr("toastCopied"));
  };

  return (
    <Modal open={open} onClose={close}>
      {!picked ? (
        <div className="modal-step">
          <div className="modal-head">
            <h3>{tr("pickAppTitle")}</h3>
            <button className="modal-close" type="button" onClick={close} aria-label="close">
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="app-pick-grid">
            {APP_TEMPLATES.map((t) => (
              <button key={t.id} type="button" className="app-pick-card" onClick={() => setPicked(t)}>
                <span
                  className="app-icon-wrap"
                  style={{ background: `color-mix(in srgb, ${t.color} 15%, var(--surface-highest))` }}
                >
                  <span className="material-symbols-outlined" style={{ color: t.color }}>
                    {t.icon}
                  </span>
                </span>
                <span>{t.name[lang]}</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="modal-step">
          <div className="modal-head">
            <h3>{picked.name[lang]}</h3>
            <button className="modal-close" type="button" onClick={close}>
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="modal-copy-row">
            <button type="button" className="modal-copy-btn" onClick={() => copy(gatewayBaseUrl)}>
              <span className="material-symbols-outlined">link</span>
              <span>{tr("copyAddr")}</span>
            </button>
            <button type="button" className="modal-copy-btn" onClick={() => copy(accessCode)}>
              <span className="material-symbols-outlined">key</span>
              <span>{tr("copyCode")}</span>
            </button>
          </div>
          <div className="modal-hint-icon">
            <span className="material-symbols-outlined">touch_app</span>
            <span>{tr("addDoneHint")}</span>
          </div>
          <button type="button" className="modal-done" onClick={close}>
            {tr("addDoneBtn")}
          </button>
        </div>
      )}
    </Modal>
  );
}
