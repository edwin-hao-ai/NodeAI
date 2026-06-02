import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { ChatToolCall } from "../lib/chat/sessions";
import { previewWritePath } from "../lib/chat/agentLoop";

interface AgentWriteConfirmProps {
  lang: Lang;
  open: boolean;
  call: ChatToolCall | null;
  workspace: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function AgentWriteConfirm({
  lang,
  open,
  call,
  workspace,
  onConfirm,
  onCancel,
}: AgentWriteConfirmProps) {
  if (!open || !call) return null;
  const path = previewWritePath(call);

  return (
    <div className="agent-confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="agent-confirm-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agent-confirm-head">
          <span className="material-symbols-outlined">edit_document</span>
          <strong>{t(lang, "agentWriteTitle")}</strong>
        </div>
        <p>{t(lang, "agentWriteSub")}</p>
        <div className="agent-confirm-meta mono">
          <div>
            <span>{t(lang, "agentWritePath")}</span> {path}
          </div>
          <div>
            <span>{t(lang, "wsLabel")}</span> {workspace}
          </div>
        </div>
        <div className="agent-confirm-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            {t(lang, "agentWriteCancel")}
          </button>
          <button type="button" className="btn" onClick={onConfirm}>
            {t(lang, "agentWriteConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}
