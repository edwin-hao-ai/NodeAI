import { useState } from "react";
import type { I18nKey } from "../i18n";
import { fmtMoney } from "../lib/format";
import { useChat } from "../state/ChatContext";
import { useApp, type ViewId } from "../state/AppContext";

const MAIN_NAV: { view: ViewId; icon: string; filled?: boolean; i18n: I18nKey }[] = [
  { view: "models", icon: "tune", filled: true, i18n: "navModels" },
  { view: "chat", icon: "chat", i18n: "navChat" },
  { view: "hub", icon: "dashboard", i18n: "navHub" },
  { view: "gateway", icon: "hub", i18n: "navGateway" },
];

const MORE_NAV: { view: ViewId; icon: string; i18n: I18nKey }[] = [
  { view: "memory", icon: "neurology", i18n: "navMemory" },
  { view: "sources", icon: "database", i18n: "navSources" },
  { view: "billing", icon: "receipt_long", i18n: "navBilling" },
  { view: "plan", icon: "workspace_premium", i18n: "navPlan" },
  { view: "settings", icon: "settings", i18n: "navSettings" },
];

export function Sidebar() {
  const {
    view,
    setView,
    tr,
    lang,
    localMode,
    setCatalogOpen,
    cloudUser,
    cloudLoggedIn,
    openSignIn,
    signOutWithCloud,
    usageSnapshot,
  } = useApp();
  const { sessions, activeSessionId, createSession, selectSession } = useChat();
  const [moreOpen, setMoreOpen] = useState(false);
  const chatMode = view === "chat";
  const showMiniHud = chatMode && (cloudLoggedIn || localMode);
  const budgetCap = usageSnapshot?.budget?.cap_yuan;
  const budgetUsed = usageSnapshot?.budget?.used_yuan ?? 0;
  const budgetPct =
    budgetCap && budgetCap > 0 ? Math.min(100, Math.round((budgetUsed / budgetCap) * 100)) : 0;
  const budgetRemain =
    budgetCap != null ? fmtMoney(Math.max(budgetCap - budgetUsed, 0), lang) : "—";
  const todaySaved = fmtMoney(usageSnapshot?.periods?.today?.saved_yuan ?? 0, lang);

  return (
    <aside className={`sidebar${chatMode ? " sidebar-chat-mode" : ""}`} id="sidebar">
      {chatMode && (
        <>
          <div className="sidebar-top">
            <button className="btn-new-chat" type="button" onClick={createSession}>
              <span className="material-symbols-outlined">edit_square</span>
              <span>{tr("newChat")}</span>
            </button>
          </div>
          {showMiniHud && (
            <button
              type="button"
              className="sidebar-mini-hud"
              title={tr("miniHudSub")}
              onClick={() => setView("hub")}
            >
              <div className="mini-hud-row">
                <span>{tr("budgetLeft")}</span>
                <strong className="mono">{budgetRemain}</strong>
              </div>
              <div className="mini-hud-row">
                <span>{tr("savedToday")}</span>
                <strong className="mono savings-text">{todaySaved}</strong>
              </div>
              <div className="mini-bar" aria-hidden>
                <div className="mini-bar-fill" style={{ width: `${budgetPct}%` }} />
              </div>
            </button>
          )}
          <div className="chat-history">
            {sessions.length === 0 ? (
              <div className="hist-item" style={{ opacity: 0.6, cursor: "default" }}>
                {tr("chatHistEmpty")}
              </div>
            ) : (
              sessions.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  className={`hist-item${s.id === activeSessionId ? " active" : ""}`}
                  onClick={() => selectSession(s.id)}
                >
                  {s.title}
                </button>
              ))
            )}
          </div>
        </>
      )}

      <nav className="sidebar-nav">
        {MAIN_NAV.map((item) => (
          <button
            key={item.view}
            type="button"
            className={`side-link${view === item.view ? " active" : ""}${item.view === "chat" ? " secondary" : ""}`}
            onClick={() => setView(item.view)}
          >
            <span className={`material-symbols-outlined${item.filled ? " filled" : ""}`}>
              {item.icon}
            </span>
            <span>{tr(item.i18n)}</span>
          </button>
        ))}

        <button
          type="button"
          className="side-link more-btn"
          onClick={() => setMoreOpen((o) => !o)}
          aria-expanded={moreOpen}
        >
          <span className="material-symbols-outlined">more_horiz</span>
          <span>{tr("navMore")}</span>
        </button>

        {moreOpen &&
          MORE_NAV.map((item) => (
            <button
              key={item.view}
              type="button"
              className={`side-link${view === item.view ? " active" : ""}`}
              style={{ paddingLeft: 28 }}
              onClick={() => {
                setView(item.view);
                setMoreOpen(false);
              }}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{tr(item.i18n)}</span>
            </button>
          ))}
        {moreOpen && (
          <button
            type="button"
            className="side-link"
            style={{ paddingLeft: 28 }}
            onClick={() => {
              setCatalogOpen(true);
              setMoreOpen(false);
            }}
          >
            <span className="material-symbols-outlined">tune</span>
            <span>{tr("moreBrowseModels")}</span>
          </button>
        )}
      </nav>

      <div className="trust-mini">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          verified
        </span>
        <span>{tr("trustVercel")}</span>
        <span className="live-dot" aria-hidden />
      </div>

      <div className="sidebar-account">
        <div
          className="acct-row"
          role="button"
          tabIndex={0}
          onClick={() => {
            if (cloudLoggedIn) setView("plan");
            else if (localMode) setView("settings");
            else openSignIn("login");
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              if (cloudLoggedIn) setView("plan");
              else if (localMode) setView("settings");
              else openSignIn("login");
            }
          }}
        >
          <div className="acct-avatar">{localMode ? "L" : cloudLoggedIn ? (cloudUser?.name?.[0] ?? "N") : "N"}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="acct-name">
              {localMode ? tr("acctLocal") : cloudLoggedIn ? (cloudUser?.name ?? tr("authLoginBtn")) : tr("authLoginBtn")}
            </div>
            <div className="acct-plan">
              {localMode ? tr("acctLocalSub") : cloudLoggedIn ? tr("acctTrial") : tr("catalogSubLogin")}
            </div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--on-surface-variant)" }}>
            chevron_right
          </span>
        </div>
        {localMode && !cloudLoggedIn && (
          <button type="button" className="acct-signin-btn" onClick={() => openSignIn("login")}>
            {tr("localModeSignIn")}
          </button>
        )}
        {cloudLoggedIn && !localMode && (
          <button
            type="button"
            className="acct-logout-btn"
            onClick={() => void signOutWithCloud()}
          >
            {tr("logoutBtn")}
          </button>
        )}
      </div>
    </aside>
  );
}
