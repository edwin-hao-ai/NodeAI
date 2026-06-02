import type { Lang } from "../i18n";
import { t } from "../i18n";
import { previewToolPath, parseToolArguments } from "../lib/chat/tools";
import type { ChatToolCall } from "../lib/chat/sessions";

interface AgentActionConfirmProps {
  lang: Lang;
  open: boolean;
  call: ChatToolCall | null;
  workspace: string;
  existingContent?: string | null;
  onConfirm: () => void;
  onCancel: () => void;
}

function newContentFromCall(call: ChatToolCall): string {
  try {
    const args = parseToolArguments(call.arguments);
    return typeof args.content === "string" ? args.content : "";
  } catch {
    return "";
  }
}

function buildDiffPreview(existing: string | null | undefined, next: string): string {
  if (existing == null || existing === "") {
    return next;
  }
  if (existing === next) {
    return existing;
  }
  const oldLines = existing.split("\n");
  const newLines = next.split("\n");
  const out: string[] = ["--- current", "+++ proposed"];
  const max = Math.max(oldLines.length, newLines.length);
  for (let i = 0; i < max; i += 1) {
    const oldLine = oldLines[i];
    const newLine = newLines[i];
    if (oldLine === newLine) {
      if (oldLine !== undefined) out.push(` ${oldLine}`);
      continue;
    }
    if (oldLine !== undefined) out.push(`-${oldLine}`);
    if (newLine !== undefined) out.push(`+${newLine}`);
  }
  return out.join("\n");
}

export function AgentActionConfirm({
  lang,
  open,
  call,
  workspace,
  existingContent,
  onConfirm,
  onCancel,
}: AgentActionConfirmProps) {
  if (!open || !call) return null;
  const path = previewToolPath(call);
  const isDelete = call.name === "delete_file";
  const isWrite = call.name === "write_file";
  const nextContent = isWrite ? newContentFromCall(call) : "";
  const diffPreview = isWrite ? buildDiffPreview(existingContent, nextContent) : null;

  return (
    <div className="agent-confirm-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="agent-confirm-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="agent-confirm-head">
          <span className="material-symbols-outlined">
            {isDelete ? "delete_forever" : "edit_document"}
          </span>
          <strong>{t(lang, isDelete ? "agentDeleteTitle" : "agentWriteTitle")}</strong>
        </div>
        <p>{t(lang, isDelete ? "agentDeleteSub" : "agentWriteSub")}</p>
        <div className="agent-confirm-meta mono">
          <div>
            <span>{t(lang, "agentWritePath")}</span> {path}
          </div>
          <div>
            <span>{t(lang, "wsLabel")}</span> {workspace}
          </div>
        </div>
        {diffPreview && (
          <div className="agent-confirm-diff">
            <div className="agent-confirm-diff-label">{t(lang, "agentWriteDiff")}</div>
            <pre className="agent-confirm-diff-body mono">{diffPreview}</pre>
          </div>
        )}
        <div className="agent-confirm-actions">
          <button type="button" className="btn ghost" onClick={onCancel}>
            {t(lang, "agentWriteCancel")}
          </button>
          <button type="button" className={`btn${isDelete ? " danger" : ""}`} onClick={onConfirm}>
            {t(lang, isDelete ? "agentDeleteConfirm" : "agentWriteConfirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

/** @deprecated use AgentActionConfirm */
export const AgentWriteConfirm = AgentActionConfirm;
