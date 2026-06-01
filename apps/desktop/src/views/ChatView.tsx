import { useCallback, useEffect, useRef, useState } from "react";
import { DEMO } from "../data/demo";
import { getStarterPrompts } from "../data/chatStarters";
import { useApp } from "../state/AppContext";

type ChatMessage =
  | { id: string; role: "user"; text: string }
  | { id: string; role: "assistant"; text: string; aha?: boolean };

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
  } = useApp();

  const [ctxOpen, setCtxOpen] = useState(false);
  const [input, setInput] = useState("");
  const [startersHidden, setStartersHidden] = useState(firstChatDone);
  const [extraMessages, setExtraMessages] = useState<ChatMessage[]>([]);
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const starterPrompts = getStarterPrompts(lang, "both");
  const savedLabel =
    lang === "zh"
      ? `¥${DEMO.BUDGET.saved.toFixed(2)}`
      : `¥${DEMO.BUDGET.saved.toFixed(2)}`;

  const scrollToBottom = useCallback(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [extraMessages, scrollToBottom]);

  useEffect(() => {
    if (firstChatDone) setStartersHidden(true);
  }, [firstChatDone]);

  const sendMessage = useCallback(
    (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || sending) return;

      const wasFirst = !firstChatDone;
      if (wasFirst) setStartersHidden(true);

      const userId = `u-${Date.now()}`;
      setExtraMessages((msgs) => [...msgs, { id: userId, role: "user", text: trimmed }]);
      setInput("");
      setSending(true);
      scrollToBottom();

      window.setTimeout(() => {
        if (wasFirst) {
          markOnboardSendMsg();
          markFirstChatDone();
          setExtraMessages((msgs) => [
            ...msgs,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text: tr("ahaReply"),
              aha: true,
            },
          ]);
        } else {
          setExtraMessages((msgs) => [
            ...msgs,
            {
              id: `a-${Date.now()}`,
              role: "assistant",
              text:
                lang === "zh"
                  ? "（演示）已收到你的消息，NodeAI 会按当前线路自动选模型并作答。"
                  : "(demo) Got your message — NodeAI will pick a model on your current route.",
            },
          ]);
        }
        setSending(false);
        scrollToBottom();
      }, 650);
    },
    [firstChatDone, lang, markFirstChatDone, scrollToBottom, sending, tr],
  );

  const onSendClick = () => sendMessage(input);

  const onInputKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendClick();
    }
  };

  const showStarters = !firstChatDone && !startersHidden;

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
          <span className="mono">1.2K/s</span>
          <span>{tr("chatLiveLink")}</span>
        </button>
      </header>
      <div className="chat-topstack">
        {!roiBannerHidden && (
          <div className="roi-banner">
            <span>
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 16, color: "var(--savings)", verticalAlign: -3 }}
              >
                savings
              </span>{" "}
              {tr("roiBannerPre")} <strong className="mono">+¥191</strong> {tr("roiBannerPost")}
            </span>
            <button type="button" onClick={dismissRoiBanner} aria-label="close">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                close
              </span>
            </button>
          </div>
        )}
        {!connectBannerHidden && (
          <div className="connect-banner show">
            <div>
              <strong>{tr("connectBannerTitle")}</strong>
              <p>{tr("connectBannerSub")}</p>
            </div>
            <div className="connect-banner-actions">
              <button type="button" className="btn-connect ghost" onClick={dismissConnectBanner}>
                {tr("connectLater")}
              </button>
              <button type="button" className="btn-connect" onClick={() => setView("gateway")}>
                {tr("connectNow")}
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
            <span>{lang === "zh" ? tr("ctxStripSummary") : tr("ctxStripSummaryEn")}</span>
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
          <textarea rows={2} placeholder={tr("chatCtxPh")} defaultValue={tr("chatCtxDefault")} />
          <p className="chat-ctx-hint">{tr("chatCtxHint")}</p>
        </div>
      </div>
      <div className="chat-body">
        <div className="chat-scroll" ref={scrollRef}>
          <div className="chat-inner">
            <div className="msg user">
              <div className="msg-role">{tr("you")}</div>
              <div className="msg-body">
                <p>{tr("demoUser")}</p>
              </div>
            </div>
            <div className="msg assistant">
              <div className="msg-role">NodeAI</div>
              <div className="msg-body">
                <p>{tr("demoAssist1")}</p>
                <div className="tool-card">
                  <span className="material-symbols-outlined">folder_open</span>
                  <div>
                    <div className="tool-name">{tr("toolRead")}</div>
                    <div className="tool-detail">~/Documents/NodeAI/README.md · 248 lines</div>
                  </div>
                </div>
                <div className="tool-card">
                  <span className="material-symbols-outlined">edit_document</span>
                  <div>
                    <div className="tool-name">{tr("toolWrite")}</div>
                    <div className="tool-detail">~/Documents/NodeAI/README.md · +Install section</div>
                  </div>
                </div>
                <p>{tr("demoAssist2")}</p>
                <div className="msg-actions">
                  <button type="button" className="remember-btn">
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      bookmark_add
                    </span>
                    <span>{tr("rememberThis")}</span>
                  </button>
                </div>
              </div>
            </div>
            {extraMessages.map((msg) =>
              msg.role === "user" ? (
                <div key={msg.id} className="msg user">
                  <div className="msg-role">{tr("you")}</div>
                  <div className="msg-body">
                    <p>{msg.text}</p>
                  </div>
                </div>
              ) : (
                <div key={msg.id} className="msg assistant">
                  <div className="msg-role">NodeAI</div>
                  <div className="msg-body">
                    <p>{msg.text}</p>
                    {msg.aha && (
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
                  </div>
                </div>
              ),
            )}
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
          <div className="composer">
            <div className="composer-row">
              <div className="composer-left">
                <button className="icon-btn" type="button" aria-label="attach file">
                  <span className="material-symbols-outlined">attach_file</span>
                </button>
                <button className="icon-btn" type="button" aria-label="attach image">
                  <span className="material-symbols-outlined">image</span>
                </button>
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
                disabled={sending || !input.trim()}
              >
                <span className="material-symbols-outlined filled">arrow_upward</span>
              </button>
            </div>
          </div>
        </div>
        <div className="composer-foot">
          <div className="workspace-wrap">
            <button type="button" className="workspace-chip">
              <span className="material-symbols-outlined">folder</span>
              <span className="ws-label">{tr("wsLabel")}</span>
              <span className="ws-path mono">{workspace}</span>
              <span className="material-symbols-outlined ws-caret">expand_more</span>
            </button>
          </div>
          <p className="composer-hint" style={{ display: "flex", alignItems: "center", gap: 4, margin: 0 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
              info
            </span>
            <span>{tr("composerHint")}</span>
          </p>
        </div>
      </div>
    </>
  );
}
