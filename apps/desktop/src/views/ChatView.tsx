import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AgentWriteConfirm } from "../components/AgentWriteConfirm";
import { getStarterPrompts } from "../data/chatStarters";
import { fmtMoney } from "../lib/format";
import { runAgentChat, streamChatRound, toApiMessages } from "../lib/chat";
import type { ChatAttachment } from "../lib/chat/attachments";
import { buildMessageContent, fileToAttachment } from "../lib/chat/attachments";
import type { ChatToolCall, StoredChatMessage } from "../lib/chat/sessions";
import { streamText } from "../lib/streamText";
import { useChat } from "../state/ChatContext";
import { useApp } from "../state/AppContext";

type ChatMessage = StoredChatMessage & {
  aha?: boolean;
  streaming?: boolean;
};

function markOnboardSendMsg() {
  try {
    const done = JSON.parse(localStorage.getItem("nodeai-onboard-steps") || "{}") as Record<
      string,
      boolean
    >;
    done.sendMsg = true;
    localStorage.setItem("nodeai-onboard-steps", JSON.stringify(done));
  } catch {
    /* ignore */
  }
}

export function ChatView() {
  const {
    tr,
    lang,
    routeLine,
    roiBannerHidden,
    connectBannerHidden,
    dismissRoiBanner,
    dismissConnectBanner,
    setView,
    workspace,
    firstChatDone,
    markFirstChatDone,
    gatewayBaseUrl,
    activeGatewayModel,
    smartRouteEnabled,
    activeIntent,
    rememberText,
    cycleWorkspace,
    memories,
    cloudSession,
    localMode,
    usageSnapshot,
    openAuth,
    showToast,
    agentEnabled,
    gatewayCatalog,
  } = useApp();

  const { messages, setMessages, activeSessionId } = useChat();

  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const [ctxOpen, setCtxOpen] = useState(false);
  const [input, setInput] = useState("");
  const [startersHidden, setStartersHidden] = useState(firstChatDone);
  const [sending, setSending] = useState(false);
  const [writeConfirm, setWriteConfirm] = useState<{
    call: ChatToolCall;
    resolve: (ok: boolean) => void;
  } | null>(null);
  const [wsOpen, setWsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const streamCancelRef = useRef<(() => void) | null>(null);
  const sessionRef = useRef(activeSessionId);

  useEffect(() => {
    if (sessionRef.current === activeSessionId) return;
    sessionRef.current = activeSessionId;
    streamCancelRef.current?.();
    streamCancelRef.current = null;
    setSending(false);
    setInput("");
    setAttachments([]);
  }, [activeSessionId]);

  const starterPrompts = getStarterPrompts(lang, "both");
  const savedLabel = fmtMoney(usageSnapshot?.periods?.today?.saved_yuan ?? 0, lang);
  const monthSaved = fmtMoney(usageSnapshot?.periods?.month?.saved_yuan ?? 0, lang);
  const chatRequests =
    usageSnapshot?.app_stats?.chat?.requests ?? usageSnapshot?.apps?.chat ?? 0;

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    if (firstChatDone) setStartersHidden(true);
  }, [firstChatDone]);

  useEffect(
    () => () => {
      streamCancelRef.current?.();
    },
    [],
  );

  const contextWindow = useMemo(() => {
    const entry = gatewayCatalog?.find((m) => m.id === activeGatewayModel);
    return entry?.context_window ?? 32_768;
  }, [gatewayCatalog, activeGatewayModel]);

  const chatOptions = useMemo(
    () => ({
      memories,
      lang,
      memoryInject: true,
      cloudToken: cloudSession,
      trafficPath: localMode ? ("byok" as const) : ("hosted" as const),
      route: { smartRouteEnabled, activeIntent, activeGatewayModel },
      contextWindow,
      agentEnabled,
    }),
    [
      activeGatewayModel,
      activeIntent,
      agentEnabled,
      cloudSession,
      contextWindow,
      lang,
      localMode,
      memories,
      smartRouteEnabled,
    ],
  );

  const appendBonusNote = useCallback(
    (text: string, bonus: { rtk?: boolean; saved?: number; prune?: boolean; pruneSaved?: number } | null) => {
      let out = text;
      if (bonus?.rtk && bonus.saved && bonus.saved > 0) {
        out += lang === "zh"
          ? `\n\n（智能压缩已生效，约省 ${bonus.saved} tokens）`
          : `\n\n(Smart compress saved ~${bonus.saved} tokens)`;
      }
      if (bonus?.prune && bonus.pruneSaved && bonus.pruneSaved > 0) {
        out += lang === "zh"
          ? `\n\n（上下文整理已生效，约省 ${bonus.pruneSaved} tokens）`
          : `\n\n(Context prune saved ~${bonus.pruneSaved} tokens)`;
      }
      return out;
    },
    [lang],
  );

  const sendMessage = useCallback(
    async (text: string, pendingAttachments: ChatAttachment[] = attachments) => {
      const trimmed = text.trim();
      const hasAttachments = pendingAttachments.length > 0;
      if ((!trimmed && !hasAttachments) || sending) return;

      if (!localMode && !cloudSession) {
        showToast(tr("toastChatNeedLogin"));
        openAuth("login");
        return;
      }

      const wasFirst = !firstChatDone;
      if (wasFirst) setStartersHidden(true);

      const historySnapshot = messages;
      const userId = `u-${Date.now()}`;
      const msgId = `a-${Date.now()}`;

      setMessages((msgs) => [
        ...msgs,
        { id: userId, role: "user", text: trimmed || tr("composerPh") },
        { id: msgId, role: "assistant", text: "", thinking: "" },
      ]);
      setInput("");
      setAttachments([]);
      setSending(true);
      scrollToBottom();

      const patchAssistant = (patch: Partial<ChatMessage>) => {
        setMessages((msgs) =>
          msgs.map((m) => (m.id === msgId && m.role === "assistant" ? { ...m, ...patch } : m)),
        );
        scrollToBottom();
      };

      const finishAssistant = (
        assistantText: string,
        thinking?: string,
        bonus?: { rtk?: boolean; saved?: number; prune?: boolean; pruneSaved?: number } | null,
      ) => {
        const withBonus = appendBonusNote(assistantText, bonus ?? null);
        if (wasFirst && withBonus) {
          markOnboardSendMsg();
          markFirstChatDone();
        }
        patchAssistant({ text: withBonus, thinking: thinking || undefined });
        setSending(false);
        scrollToBottom();
      };

      try {
        if (agentEnabled) {
          const { result, uiMessages } = await runAgentChat({
            baseUrl: gatewayBaseUrl,
            history: historySnapshot,
            userText: trimmed,
            attachments: pendingAttachments,
            workspace,
            options: chatOptions,
            onDelta: (update) => {
              patchAssistant({ text: update.content, thinking: update.thinking });
            },
            onToolStart: () => scrollToBottom(),
            onToolResult: () => scrollToBottom(),
            confirmWrite: ({ call }) =>
              new Promise<boolean>((resolve) => {
                setWriteConfirm({ call, resolve });
              }),
          });

          if (result.error && !result.content && !uiMessages.length) {
            setMessages((msgs) => msgs.filter((m) => m.id !== msgId && m.id !== userId));
            showToast(`${tr("toastChatFailed")}: ${result.error}`);
            setSending(false);
            return;
          }

          setMessages((msgs) => {
            const base = msgs.filter((m) => m.id !== msgId);
            return [
              ...base,
              ...uiMessages,
              {
                id: msgId,
                role: "assistant" as const,
                text: appendBonusNote(result.content ?? "", result.bonus),
                thinking: result.thinking || undefined,
              },
            ];
          });
          if (wasFirst && result.content) {
            markOnboardSendMsg();
            markFirstChatDone();
          }
          setSending(false);
          scrollToBottom();
          return;
        }

        const apiMessages = [
          ...toApiMessages(historySnapshot),
          {
            role: "user" as const,
            content: buildMessageContent(trimmed, pendingAttachments),
          },
        ];
        const { content, thinking, bonus, streamed, error } = await streamChatRound(
          gatewayBaseUrl,
          apiMessages,
          chatOptions,
          (update) => {
            patchAssistant({ text: update.content, thinking: update.thinking });
          },
        );

        if (error && !content) {
          setMessages((msgs) => msgs.filter((m) => m.id !== msgId && m.id !== userId));
          showToast(`${tr("toastChatFailed")}: ${error}`);
          setSending(false);
          return;
        }

        const assistantText = content ?? "";
        if (!streamed && assistantText) {
          streamCancelRef.current?.();
          const withBonus = appendBonusNote(assistantText, bonus);
          streamCancelRef.current = streamText(
            withBonus,
            (partial) => patchAssistant({ text: partial }),
            () => finishAssistant(withBonus, thinking || undefined, bonus ?? undefined),
          );
          return;
        }

        finishAssistant(assistantText, thinking || undefined, bonus ?? undefined);
      } catch (err) {
        setMessages((msgs) => msgs.filter((m) => m.id !== msgId && m.id !== userId));
        showToast(
          `${tr("toastChatFailed")}: ${err instanceof Error ? err.message : "unknown"}`,
        );
        setSending(false);
      }
    },
    [
      agentEnabled,
      appendBonusNote,
      attachments,
      chatOptions,
      cloudSession,
      firstChatDone,
      gatewayBaseUrl,
      lang,
      localMode,
      markFirstChatDone,
      messages,
      openAuth,
      scrollToBottom,
      sending,
      setMessages,
      showToast,
      tr,
      workspace,
    ],
  );

  const onPickFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    const next = await Promise.all(Array.from(files).map((f) => fileToAttachment(f)));
    setAttachments((prev) => [...prev, ...next].slice(0, 8));
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
  };

  const onSendClick = () => sendMessage(input);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendClick();
    }
  };

  const showStarters = !firstChatDone && !startersHidden && messages.length === 0;
  const ctxSummary =
    memories.length > 0
      ? tr("ctxStripLive").replace("{n}", String(memories.length))
      : tr("ctxStripEmpty");

  return (
    <>
      <header className="chat-header">
        <button
          type="button"
          className="route-readonly-chip"
          onClick={() => setView("models")}
        >
          <span className="material-symbols-outlined">route</span>
          <span className="route-line-text">{routeLine}</span>
          <span className="route-change-link">{tr("routeChangeLink")}</span>
        </button>
        <button type="button" className="chat-hub-link" onClick={() => setView("hub")}>
          <span className="material-symbols-outlined">monitoring</span>
          {chatRequests > 0 && <span className="mono">{chatRequests}</span>}
          <span>{tr("chatLiveLink")}</span>
        </button>
      </header>
      <div className="chat-topstack">
        {!roiBannerHidden && monthSaved !== fmtMoney(0, lang) && (
          <div className="roi-banner">
            <span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: "var(--savings)", verticalAlign: -3 }}
              >
                savings
              </span>{" "}
              {tr("roiBannerPre")} <strong className="mono">{monthSaved}</strong> {tr("roiBannerPost")}
            </span>
            <button type="button" onClick={dismissRoiBanner} aria-label="close">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </div>
        )}
        {!connectBannerHidden && !cloudSession && !localMode && (
          <div className="connect-banner show">
            <div>
              <strong>{tr("connectBannerTitle")}</strong>
              <p>{tr("connectBannerSub")}</p>
            </div>
            <div className="connect-banner-actions">
              <button type="button" className="btn-connect ghost" onClick={dismissConnectBanner}>
                {tr("connectLater")}
              </button>
              <button type="button" className="btn-connect" onClick={() => openAuth("login")}>
                {tr("setSignInBtn")}
              </button>
            </div>
          </div>
        )}
        <div className="context-strip">
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--secondary)" }}>
            neurology
          </span>
          <span>
            <strong>{tr("ctxStripLbl")}</strong>
            <span>{ctxSummary}</span>
          </span>
          <div className="context-strip-actions">
            <button type="button" onClick={() => setView("memory")}>
              {tr("ctxStripMemory")}
            </button>
            <button type="button" onClick={() => setCtxOpen((o) => !o)}>
              {ctxOpen ? tr("ctxStripCustomHide") : tr("ctxStripCustom")}
            </button>
          </div>
        </div>
        <div className={`chat-ctx-advanced${ctxOpen ? " open" : ""}`}>
          <textarea rows={2} placeholder={tr("chatCtxPh")} />
          <p className="chat-ctx-hint">{tr("chatCtxHint")}</p>
        </div>
      </div>
      <div className="chat-body">
        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-inner">
            {messages.length === 0 && (
              <div
                className="chat-empty-hint"
                style={{ fontSize: 13, color: "var(--on-surface-variant)", padding: "12px 0" }}
              >
                {tr("chatEmptyHint")}
              </div>
            )}
            {messages.map((msg, idx) => {
              const isLastAssistant =
                msg.role === "assistant" && idx === messages.length - 1 && sending;
              const showAha = msg.role === "assistant" && idx === 1 && firstChatDone && messages.length === 2;

              if (msg.role === "tool") {
                return (
                  <div key={msg.id} className="msg tool">
                    <div className="msg-role">{msg.toolName ?? tr("agentToolLbl")}</div>
                    <div className="msg-body">
                      <pre className="tool-result mono">{msg.text}</pre>
                    </div>
                  </div>
                );
              }

              if (msg.role === "user") {
                return (
                  <div key={msg.id} className="msg user">
                    <div className="msg-role">{tr("you")}</div>
                    <div className="msg-body">
                      <p>{msg.text}</p>
                    </div>
                  </div>
                );
              }

              return (
                <div key={msg.id} className="msg assistant">
                  <div className="msg-role">NodeAI</div>
                  <div className="msg-body">
                    {msg.toolCalls?.map((call) => (
                      <div key={call.id} className="tool-call-chip">
                        <span className="material-symbols-outlined">handyman</span>
                        <span>{call.name}</span>
                      </div>
                    ))}
                    {msg.thinking ? (
                      <div className="thinking-block">
                        <div className="thinking-label">{tr("chatThinkingLbl")}</div>
                        <p className="thinking-text">
                          {msg.thinking}
                          {isLastAssistant ? "▍" : ""}
                        </p>
                      </div>
                    ) : null}
                    {msg.text ? (
                      <p>
                        {msg.text}
                        {isLastAssistant && !msg.thinking ? "▍" : isLastAssistant && msg.text ? "▍" : ""}
                      </p>
                    ) : null}
                    {!msg.text && isLastAssistant && !msg.thinking ? <p>▍</p> : null}
                    {showAha && !isLastAssistant && (
                      <div className="aha-banner">
                        <span className="material-symbols-outlined">celebration</span>
                        <div className="aha-text">
                          <strong>{tr("ahaTitle")}</strong>
                          <span>{tr("ahaSub").replace("{v}", savedLabel)}</span>
                        </div>
                        <button type="button" className="aha-go" onClick={() => setView("hub")}>
                          {tr("ahaGo")}
                        </button>
                      </div>
                    )}
                    {!isLastAssistant && msg.text && (
                      <div className="msg-actions">
                        <button type="button" className="remember-btn" onClick={() => rememberText(msg.text)}>
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            bookmark_add
                          </span>
                          <span>{tr("rememberThis")}</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      <div className="composer-wrap">
        {showStarters && (
          <div className="chat-starters composer-box">
            <div className="chat-starters-head">
              <span className="material-symbols-outlined">auto_awesome</span>
              <span>{tr("startersHead")}</span>
            </div>
            <div className="chat-starters-chips">
              {starterPrompts.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="starter-chip"
                  onClick={() => {
                    setInput(s);
                    inputRef.current?.focus();
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        <div className="composer-box">
          <div className="attach-chips">
            {attachments.map((a) => (
              <span key={a.id} className="attach-chip">
                {a.kind === "image" && a.previewUrl ? (
                  <img src={a.previewUrl} alt="" className="attach-chip-thumb" />
                ) : (
                  <span className="material-symbols-outlined">description</span>
                )}
                <span className="attach-chip-name">{a.name}</span>
                <button
                  type="button"
                  className="attach-chip-rm"
                  aria-label={tr("tipRemoveAttach")}
                  onClick={() => removeAttachment(a.id)}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    close
                  </span>
                </button>
              </span>
            ))}
          </div>
          <div className="composer">
            <div className="composer-row">
              <div className="composer-left">
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={tr("tipAttachFile")}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  aria-label={tr("tipAttachImage")}
                  onClick={() => imageInputRef.current?.click()}
                >
                  <span className="material-symbols-outlined">image</span>
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  hidden
                  multiple
                  accept=".md,.txt,.pdf,.doc,.docx,.json,.csv,.ts,.tsx,.js,.jsx,.py,.rs,.toml,.yaml,.yml,.xml,.html,.css"
                  onChange={(e) => void onPickFiles(e.target.files)}
                />
                <input
                  ref={imageInputRef}
                  type="file"
                  hidden
                  multiple
                  accept="image/*"
                  onChange={(e) => void onPickFiles(e.target.files)}
                />
              </div>
              <textarea
                ref={inputRef}
                rows={1}
                placeholder={tr("composerPh")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKeyDown}
                disabled={sending}
              />
              <button
                className="send-btn"
                type="button"
                aria-label="send"
                onClick={onSendClick}
                disabled={sending || (!input.trim() && attachments.length === 0)}
              >
                <span className="material-symbols-outlined filled">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
        <div className="composer-foot">
          <div className="workspace-wrap">
            <button type="button" className="workspace-chip" onClick={() => setWsOpen((o) => !o)}>
              <span className="material-symbols-outlined">folder</span>
              <span className="ws-label">{tr("wsLabel")}</span>
              <span className="ws-path mono">{workspace}</span>
              <span className="material-symbols-outlined ws-caret">expand_more</span>
            </button>
            {wsOpen && (
              <div className="ws-popover open">
                <button type="button" onClick={() => { cycleWorkspace(); setWsOpen(false); }}>
                  {tr("wsChange")}
                </button>
              </div>
            )}
          </div>
          <p className="composer-hint" style={{ display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              info
            </span>
            <span>{tr("composerHint")}</span>
          </p>
        </div>
      </div>
      <AgentWriteConfirm
        lang={lang}
        open={Boolean(writeConfirm)}
        call={writeConfirm?.call ?? null}
        workspace={workspace}
        onConfirm={() => {
          writeConfirm?.resolve(true);
          setWriteConfirm(null);
        }}
        onCancel={() => {
          writeConfirm?.resolve(false);
          setWriteConfirm(null);
        }}
      />
    </>
  );
}
