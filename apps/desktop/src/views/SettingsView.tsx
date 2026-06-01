import { useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { Switch } from "../components/ui/Switch";
import { useApp } from "../state/AppContext";

const THEMES = [
  "forest-dark",
  "forest-light",
  "slate-dark",
  "slate-light",
  "indigo-dark",
] as const;

export function SettingsView() {
  const {
    tr,
    lang,
    theme,
    setTheme,
    toggleLang,
    gatewayPort,
    gatewayBaseUrl,
    setGatewayPort,
    proxy,
    localMode,
    openAuth,
    setView,
  } = useApp();

  const [portInput, setPortInput] = useState(String(gatewayPort));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [sw, setSw] = useState({
    localServer: true,
    crossMem: true,
    cursorWrite: false,
    smartRoute: true,
    byokRoute: true,
    failover: true,
    hybridFb: false,
    compress: true,
    concise: true,
    budgetAlert: true,
    agentFiles: true,
    prune: false,
  });

  const savePort = () => {
    void setGatewayPort(parseInt(portInput, 10));
  };

  return (
    <PageScroll>
      <PageHead title={tr("navSettings")} />

      <div className="setting-group">{tr("setGrpGeneral")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setLang")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setLangSub")}</p>
        </div>
        <button className="lang-btn" type="button" onClick={toggleLang}>
          {lang === "zh" ? "EN" : "中文"}
        </button>
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setTheme")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setThemeSub")}</p>
        </div>
        <div className="theme-chips">
          {THEMES.map((t) => (
            <button
              key={t}
              type="button"
              className={`theme-chip${theme === t ? " active" : ""}`}
              onClick={() => setTheme(t)}
            >
              {t.replace("-", " ")}
            </button>
          ))}
        </div>
      </div>

      <div className="setting-group">{tr("setGrpAccount")}</div>
      <div className="setting">
        <div>
          <h4>{localMode ? tr("acctLocal") : "demo@nodeai.app"}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
            {localMode ? tr("acctLocalSub") : tr("acctTrial")}
          </p>
        </div>
        <button className="btn-outlined" type="button" onClick={() => setView("plan")}>
          {tr("managePlan")}
        </button>
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setLogout")}</h4>
        </div>
        <button className="btn-outlined" type="button" onClick={() => openAuth("login")}>
          {tr("logoutBtn")}
        </button>
      </div>
      {localMode && (
        <div className="setting">
          <div>
            <h4>{tr("setSignInHosted")}</h4>
            <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setSignInHostedSub")}</p>
          </div>
          <button className="btn-outlined" type="button" onClick={() => openAuth("register")}>
            {tr("setSignInBtn")}
          </button>
        </div>
      )}

      <div className="setting-group">{tr("setGrpGateway")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setLocalServer")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setLocalServerSub")}</p>
          <p className="local-server-state">
            <span className="dot" />
            <span>
              {proxy?.running ? tr("setLocalServerOn") : tr("setLocalServerOff")}
            </span>
          </p>
        </div>
        <Switch on={sw.localServer} onToggle={() => setSw((s) => ({ ...s, localServer: !s.localServer }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setGatewayPort")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setGatewayPortSub")}</p>
          <p className="mono" style={{ fontSize: 11, color: "var(--secondary)", marginTop: 6 }}>
            {gatewayBaseUrl}
          </p>
        </div>
        <input
          type="number"
          className="port-input"
          min={1024}
          max={65535}
          value={portInput}
          onChange={(e) => setPortInput(e.target.value)}
          onBlur={savePort}
        />
      </div>

      <div className="setting-group">{tr("setGrpChat")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setReplyLang")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setReplyLangSub")}</p>
        </div>
        <select
          style={{
            padding: "6px 10px",
            borderRadius: 8,
            border: "1px solid var(--outline-variant)",
            background: "var(--surface-container)",
            color: "inherit",
            font: "inherit",
            fontSize: 13,
          }}
          defaultValue="zh"
        >
          <option value="zh">中文</option>
          <option value="en">English</option>
          <option value="bilingual">中英混合</option>
        </select>
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setCrossMem")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setCrossMemSub")}</p>
        </div>
        <Switch on={sw.crossMem} onToggle={() => setSw((s) => ({ ...s, crossMem: !s.crossMem }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setCursorWrite")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setCursorWriteSub")}</p>
        </div>
        <Switch on={sw.cursorWrite} onToggle={() => setSw((s) => ({ ...s, cursorWrite: !s.cursorWrite }))} />
      </div>

      <div className="setting-group">{tr("setGrpRoute")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setSmartRoute")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setSmartRouteSub")}</p>
        </div>
        <Switch on={sw.smartRoute} onToggle={() => setSw((s) => ({ ...s, smartRoute: !s.smartRoute }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setByokRoute")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setByokRouteSub")}</p>
        </div>
        <Switch on={sw.byokRoute} onToggle={() => setSw((s) => ({ ...s, byokRoute: !s.byokRoute }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setFailover")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setFailoverSub")}</p>
        </div>
        <Switch on={sw.failover} onToggle={() => setSw((s) => ({ ...s, failover: !s.failover }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setHybridFb")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setHybridFbSub")}</p>
        </div>
        <Switch on={sw.hybridFb} onToggle={() => setSw((s) => ({ ...s, hybridFb: !s.hybridFb }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setTranslator")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setTranslatorSub")}</p>
        </div>
        <Switch on disabled />
      </div>

      <div className="setting-group">{tr("setGrpSave")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setCompress")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setCompressSub")}</p>
        </div>
        <Switch on={sw.compress} onToggle={() => setSw((s) => ({ ...s, compress: !s.compress }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setConcise")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setConciseSub")}</p>
        </div>
        <Switch on={sw.concise} onToggle={() => setSw((s) => ({ ...s, concise: !s.concise }))} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setBudgetAlert")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setBudgetAlertSub")}</p>
        </div>
        <Switch on={sw.budgetAlert} onToggle={() => setSw((s) => ({ ...s, budgetAlert: !s.budgetAlert }))} />
      </div>

      <button
        type="button"
        className="collapse-toggle"
        onClick={() => setAdvancedOpen((o) => !o)}
      >
        <span className="material-symbols-outlined">{advancedOpen ? "expand_less" : "expand_more"}</span>
        <span>{tr("setAdvanced")}</span>
      </button>
      {advancedOpen && (
        <div className="settings-advanced">
          <div className="setting">
            <div>
              <h4>{tr("setAgent")}</h4>
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setAgentSub")}</p>
            </div>
            <Switch on={sw.agentFiles} onToggle={() => setSw((s) => ({ ...s, agentFiles: !s.agentFiles }))} />
          </div>
          <div className="setting">
            <div>
              <h4>{tr("setPrune")}</h4>
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setPruneSub")}</p>
            </div>
            <Switch on={sw.prune} onToggle={() => setSw((s) => ({ ...s, prune: !s.prune }))} />
          </div>
        </div>
      )}
    </PageScroll>
  );
}
