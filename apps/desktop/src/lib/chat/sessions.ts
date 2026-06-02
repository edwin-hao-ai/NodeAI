export type ChatRole = "user" | "assistant" | "tool";

export interface ChatToolCall {
  id: string;
  name: string;
  arguments: string;
}

export interface StoredChatMessage {
  id: string;
  role: ChatRole;
  text: string;
  thinking?: string;
  toolCalls?: ChatToolCall[];
  toolCallId?: string;
  toolName?: string;
}

export interface ApiChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content?: string | unknown;
  tool_calls?: Array<{
    id: string;
    type: "function";
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
  name?: string;
}

const STORAGE_SESSIONS = "nodeai-chat-sessions-v1";
const STORAGE_ACTIVE = "nodeai-chat-active-id";
const LEGACY_MESSAGES = "nodeai-chat-messages";

export function sessionTitleFromText(text: string, fallback: string): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (!t) return fallback;
  return t.length > 28 ? `${t.slice(0, 28)}…` : t;
}

export function loadChatSessions(): { sessions: ChatSession[]; activeId: string } {
  try {
    const raw = localStorage.getItem(STORAGE_SESSIONS);
    if (raw) {
      const sessions = JSON.parse(raw) as ChatSession[];
      if (Array.isArray(sessions) && sessions.length) {
        const activeId = localStorage.getItem(STORAGE_ACTIVE);
        const id = activeId && sessions.some((s) => s.id === activeId) ? activeId : sessions[0].id;
        return { sessions, activeId: id };
      }
    }
  } catch {
    /* ignore */
  }

  const migrated = migrateLegacyMessages();
  if (migrated) {
    persistChatSessions([migrated], migrated.id);
    return { sessions: [migrated], activeId: migrated.id };
  }

  const fresh = createEmptySession();
  persistChatSessions([fresh], fresh.id);
  return { sessions: [fresh], activeId: fresh.id };
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: StoredChatMessage[];
}

function migrateLegacyMessages(): ChatSession | null {
  try {
    const raw = localStorage.getItem(LEGACY_MESSAGES);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as StoredChatMessage[];
    if (!Array.isArray(parsed) || !parsed.length) return null;
    localStorage.removeItem(LEGACY_MESSAGES);
    const now = Date.now();
    const firstUser = parsed.find((m) => m.role === "user");
    return {
      id: `c-${now}`,
      title: firstUser ? sessionTitleFromText(firstUser.text, "Chat") : "Chat",
      createdAt: now,
      updatedAt: now,
      messages: parsed.filter((m) => m.role === "user" || m.role === "assistant" || m.role === "tool"),
    };
  } catch {
    return null;
  }
}

export function createEmptySession(title = "New chat"): ChatSession {
  const now = Date.now();
  return {
    id: `c-${now}`,
    title,
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function persistChatSessions(sessions: ChatSession[], activeId: string) {
  localStorage.setItem(STORAGE_SESSIONS, JSON.stringify(sessions));
  localStorage.setItem(STORAGE_ACTIVE, activeId);
}

/** Map stored UI messages to OpenAI-compatible API messages (excluding the pending user turn). */
export function toApiMessages(messages: StoredChatMessage[]): ApiChatMessage[] {
  const out: ApiChatMessage[] = [];
  for (const msg of messages) {
    if (msg.role === "tool") {
      out.push({
        role: "tool",
        tool_call_id: msg.toolCallId ?? msg.id,
        name: msg.toolName,
        content: msg.text,
      });
      continue;
    }
    if (msg.role === "assistant" && msg.toolCalls?.length) {
      out.push({
        role: "assistant",
        content: msg.text || null,
        tool_calls: msg.toolCalls.map((call) => ({
          id: call.id,
          type: "function" as const,
          function: { name: call.name, arguments: call.arguments },
        })),
      });
      continue;
    }
    if (msg.text.trim()) {
      out.push({ role: msg.role, content: msg.text.trim() });
    }
  }
  return out;
}

/** @deprecated use toApiMessages */
export function toApiHistory(messages: StoredChatMessage[]): { role: "user" | "assistant"; content: string }[] {
  return toApiMessages(messages)
    .filter((m): m is ApiChatMessage & { role: "user" | "assistant"; content: string } =>
      (m.role === "user" || m.role === "assistant") && typeof m.content === "string" && m.content.length > 0,
    )
    .map((m) => ({ role: m.role, content: m.content }));
}
