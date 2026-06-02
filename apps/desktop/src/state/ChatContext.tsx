import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { t } from "../i18n";
import {
  createEmptySession,
  loadChatSessions,
  persistChatSessions,
  sessionTitleFromText,
  type ChatSession,
  type StoredChatMessage,
} from "../lib/chat/sessions";
import { useApp } from "./AppContext";

interface ChatContextValue {
  sessions: ChatSession[];
  activeSessionId: string;
  messages: StoredChatMessage[];
  createSession: () => void;
  selectSession: (id: string) => void;
  setMessages: (updater: (prev: StoredChatMessage[]) => StoredChatMessage[]) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function sortSessions(sessions: ChatSession[]): ChatSession[] {
  return [...sessions].sort((a, b) => b.updatedAt - a.updatedAt);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { lang } = useApp();
  const [state, setState] = useState(() => loadChatSessions());

  const activeSession = state.sessions.find((s) => s.id === state.activeId) ?? state.sessions[0];

  const setMessages = useCallback(
    (updater: (prev: StoredChatMessage[]) => StoredChatMessage[]) => {
      setState((prev) => {
        const activeId = prev.activeId ?? prev.sessions[0]?.id;
        if (!activeId) return prev;
        const sessions = prev.sessions.map((s) => {
          if (s.id !== activeId) return s;
          const nextMessages = updater(s.messages);
          const firstUser = nextMessages.find((m) => m.role === "user");
          const title =
            firstUser && s.title === t(lang, "chatNewTitle")
              ? sessionTitleFromText(firstUser.text, t(lang, "chatNewTitle"))
              : s.title;
          return {
            ...s,
            title,
            messages: nextMessages,
            updatedAt: Date.now(),
          };
        });
        persistChatSessions(sortSessions(sessions), activeId);
        return { sessions: sortSessions(sessions), activeId };
      });
    },
    [lang],
  );

  const createSession = useCallback(() => {
    const session = createEmptySession(t(lang, "chatNewTitle"));
    setState((prev) => {
      const sessions = [session, ...prev.sessions];
      persistChatSessions(sessions, session.id);
      return { sessions, activeId: session.id };
    });
  }, [lang]);

  const selectSession = useCallback((id: string) => {
    setState((prev) => {
      if (!prev.sessions.some((s) => s.id === id)) return prev;
      persistChatSessions(prev.sessions, id);
      return { ...prev, activeId: id };
    });
  }, []);

  const value = useMemo<ChatContextValue>(
    () => ({
      sessions: state.sessions,
      activeSessionId: activeSession?.id ?? state.activeId ?? "",
      messages: activeSession?.messages ?? [],
      createSession,
      selectSession,
      setMessages,
    }),
    [activeSession, createSession, selectSession, setMessages, state.activeId, state.sessions],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChat must be used within ChatProvider");
  return ctx;
}
