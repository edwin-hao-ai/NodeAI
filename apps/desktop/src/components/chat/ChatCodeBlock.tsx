import { Children, isValidElement, useMemo, type ReactNode, type ReactElement } from "react";
import { copyText } from "../ui/CopyButton";
import { useApp } from "../../state/AppContext";

const LANG_LABELS: Record<string, string> = {
  ts: "TypeScript",
  tsx: "TypeScript",
  js: "JavaScript",
  jsx: "JavaScript",
  py: "Python",
  rs: "Rust",
  toml: "TOML",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  md: "Markdown",
  bash: "Shell",
  sh: "Shell",
  zsh: "Shell",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
};

function langLabel(raw: string): string {
  const id = raw.trim().toLowerCase();
  if (!id) return "Code";
  return LANG_LABELS[id] ?? id.charAt(0).toUpperCase() + id.slice(1);
}

function extractCode(children: ReactNode): { lang: string; text: string } {
  const child = Children.toArray(children)[0];
  if (!isValidElement(child)) return { lang: "", text: "" };
  const props = (child as ReactElement<{ className?: string; children?: ReactNode }>).props;
  const className = props.className ?? "";
  const lang = className.replace(/^language-/, "").split(/\s/)[0] ?? "";
  const text = String(props.children ?? "").replace(/\n$/, "");
  return { lang, text };
}

export function ChatCodeBlock({ children }: { children: ReactNode }) {
  const { tr, showToast } = useApp();
  const { lang, text } = useMemo(() => extractCode(children), [children]);

  const onCopy = async () => {
    if (!text) return;
    try {
      await copyText(text);
      showToast(tr("toastCopied"));
    } catch {
      showToast(tr("toastChatFailed"));
    }
  };

  return (
    <div className="chat-code-block">
      <div className="chat-code-head">
        <span className="chat-code-lang">{langLabel(lang)}</span>
        <button type="button" className="chat-code-copy" onClick={() => void onCopy()}>
          <span className="material-symbols-outlined">content_copy</span>
          <span>{tr("chatMdCopy")}</span>
        </button>
      </div>
      <pre className="chat-code-pre">{children}</pre>
    </div>
  );
}
