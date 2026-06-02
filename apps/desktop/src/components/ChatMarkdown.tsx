import type { Components } from "react-markdown";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauriShell } from "../lib/platform";
import { ChatCodeBlock } from "./chat/ChatCodeBlock";

interface ChatMarkdownProps {
  text: string;
  /** Show typing cursor after content (streaming assistant). */
  streaming?: boolean;
}

async function openExternalLink(href: string) {
  try {
    if (isTauriShell()) {
      await openUrl(href);
      return;
    }
  } catch {
    /* fallback */
  }
  window.open(href, "_blank", "noopener,noreferrer");
}

const markdownComponents: Components = {
  pre({ children }) {
    return <ChatCodeBlock>{children}</ChatCodeBlock>;
  },
  code({ className, children, ...rest }) {
    const isFence = Boolean(className?.startsWith("language-"));
    if (isFence) {
      return (
        <code className={className} {...rest}>
          {children}
        </code>
      );
    }
    return (
      <code className="chat-md-inline" {...rest}>
        {children}
      </code>
    );
  },
  a({ href, children }) {
    if (!href) return <span>{children}</span>;
    return (
      <a
        href={href}
        className="chat-md-link"
        onClick={(e) => {
          if (href.startsWith("http://") || href.startsWith("https://")) {
            e.preventDefault();
            void openExternalLink(href);
          }
        }}
      >
        {children}
      </a>
    );
  },
  table({ children }) {
    return (
      <div className="chat-md-table-wrap">
        <table>{children}</table>
      </div>
    );
  },
  img({ src, alt }) {
    if (!src) return null;
    return <img src={src} alt={alt ?? ""} className="chat-md-img" loading="lazy" />;
  },
};

export function ChatMarkdown({ text, streaming = false }: ChatMarkdownProps) {
  return (
    <div className={`chat-md${streaming ? " chat-md-streaming" : ""}`}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {text}
      </ReactMarkdown>
      {streaming ? <span className="chat-stream-cursor" aria-hidden /> : null}
    </div>
  );
}
