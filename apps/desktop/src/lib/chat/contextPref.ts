import type { ApiChatMessage } from "./sessions";
import { replyLangSystemLine, type ReplyLang } from "../userPrefs";

const STORAGE = "nodeai-chat-ctx-pref";
const SESSION_CTX_MARKER = "NodeAI session context";

export function loadChatContextPref(): string {
  try {
    return localStorage.getItem(STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function saveChatContextPref(text: string): void {
  try {
    const trimmed = text.trim();
    if (trimmed) localStorage.setItem(STORAGE, trimmed);
    else localStorage.removeItem(STORAGE);
  } catch {
    /* ignore */
  }
}

function stripSessionSystemMessages(messages: ApiChatMessage[]): ApiChatMessage[] {
  return messages.filter(
    (m) =>
      !(
        m.role === "system" &&
        typeof m.content === "string" &&
        m.content.startsWith(SESSION_CTX_MARKER)
      ),
  );
}

/** Reply language + per-chat instructions → one system message (not in session history). */
export function prependSessionContextToApi(
  messages: ApiChatMessage[],
  pref: string | undefined,
  lang: "zh" | "en",
  replyLang?: ReplyLang,
): ApiChatMessage[] {
  const parts: string[] = [];
  if (replyLang) parts.push(replyLangSystemLine(replyLang, lang));
  const trimmed = pref?.trim() ?? "";
  if (trimmed) {
    parts.push(
      lang === "zh"
        ? `本对话附加说明：\n${trimmed}`
        : `Additional instructions for this chat:\n${trimmed}`,
    );
  }
  if (!parts.length) return messages;

  const content =
    lang === "zh"
      ? `${SESSION_CTX_MARKER}：\n${parts.join("\n\n")}`
      : `${SESSION_CTX_MARKER}:\n${parts.join("\n\n")}`;

  return [{ role: "system", content }, ...stripSessionSystemMessages(messages)];
}
