import { useState } from "react";
import type { I18nKey } from "../i18n";
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
  const { view, setView, tr, localMode } = useApp();
  const [moreOpen, setMoreOpen] = useState(false);
  const chatMode = view === "chat";

  return (
    <aside className={`sidebar${chatMode ? " sidebar-chat-mode" : ""}`} id="sidebar">
      {chatMode && (
        <>
          <div className="sidebar-top">
            <button className="btn-new-chat" type="button">
              <span className="material-symbols-outlined">edit_square</span>
              <span>{tr("newChat")}</span>
            </button>
          </div>
          <div className="chat-history">
            <button className="hist-item active" type="button">
              {tr("hist1")}
            </button>
            <button className="hist-item" type="button">
              {tr("hist2")}
            </button>
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
      </nav>

      <div className="trust-mini">
        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
          verified
        </span>
        <span>{tr("trustVercel")}</span>
        <span className="live-dot" aria-hidden />
      </div>

      <div className="sidebar-account">
        <div className="acct-row">
          <div className="acct-avatar">{localMode ? "L" : "N"}</div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="acct-name">{localMode ? tr("acctLocal") : "Demo"}</div>
            <div className="acct-plan">{localMode ? tr("acctLocalSub") : tr("acctTrial")}</div>
          </div>
          <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--on-surface-variant)" }}>
            chevron_right
          </span>
        </div>
      </div>
    </aside>
  );
}
