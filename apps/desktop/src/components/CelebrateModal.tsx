import { fmtMoney } from "../lib/format";
import { useApp } from "../state/AppContext";

interface CelebrateModalProps {
  open: boolean;
  onClose: () => void;
}

export function CelebrateModal({ open, onClose }: CelebrateModalProps) {
  const { tr, lang, setView, usageSnapshot } = useApp();
  const savedVal = usageSnapshot?.periods?.today?.saved_yuan ?? 0;
  const saved = fmtMoney(savedVal, lang);

  if (!open) return null;

  return (
    <div
      className="celebrate-backdrop open"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="celebrate-sheet" role="dialog">
        <div className="celebrate-icon">
          <span className="material-symbols-outlined" style={{ fontSize: 32 }}>
            celebration
          </span>
        </div>
        <h2>{tr("celebrateTitle")}</h2>
        <p>{tr("celebrateSub")}</p>
        <div className="celebrate-stat mono">+{saved}</div>
        <p style={{ fontSize: 12, color: "var(--on-surface-variant)", marginBottom: 16 }}>
          {tr("celebrateFoot")}
        </p>
        <button
          type="button"
          className="btn-primary-celebrate"
          onClick={() => {
            onClose();
            setView("hub");
          }}
        >
          {tr("celebrateOk")}
        </button>
      </div>
    </div>
  );
}
