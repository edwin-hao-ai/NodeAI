import { useCallback, useEffect, useState } from "react";
import { PageHead, PageScroll } from "../components/ui/PageScroll";
import { Switch } from "../components/ui/Switch";
import {
  DEFAULT_BONUS_PROFILE,
  loadBonusProfileLocal,
  saveBonusProfileLocal,
  syncBonusProfile,
  type CompressionProfile,
} from "../lib/bonusApi";
import {
  loadHybridFallbackEnabled,
  saveHybridFallback,
} from "../lib/hybridFallback";
import { loadUserPrefs, saveUserPrefs, type ReplyLang } from "../lib/userPrefs";
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
    openSignIn,
    cloudUser,
    cloudLoggedIn,
    signOutWithCloud,
    setView,
    smartRouteEnabled,
    toggleSmartRoute,
    agentEnabled,
    setAgentEnabled,
  } = useApp();

  const [portInput, setPortInput] = useState(String(gatewayPort));
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [bonus, setBonus] = useState<CompressionProfile>(() => loadBonusProfileLocal());
  const [sw, setSw] = useState({
    crossMem: true,
    failover: true,
    hybridFb: loadHybridFallbackEnabled(),
  });
  const [replyLang, setReplyLang] = useState<ReplyLang>(() => loadUserPrefs().replyLang);

  const pushBonus = useCallback(
    async (next: CompressionProfile) => {
      setBonus(next);
      saveBonusProfileLocal(next);
      if (proxy?.running) {
        await syncBonusProfile(gatewayBaseUrl, next);
      }
    },
    [gatewayBaseUrl, proxy?.running],
  );

  useEffect(() => {
    if (!proxy?.running) return;
    void (async () => {
      const remote = await fetch(`${gatewayBaseUrl.replace(/\/$/, "")}/nodeai/bonus`)
        .then((r) => (r.ok ? r.json() : null))
        .catch(() => null);
      if (remote) {
        const merged = { ...DEFAULT_BONUS_PROFILE, ...remote } as CompressionProfile;
        setBonus(merged);
        saveBonusProfileLocal(merged);
      } else {
        await syncBonusProfile(gatewayBaseUrl, bonus);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [proxy?.running, gatewayBaseUrl]);

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
          <h4>{localMode ? tr("acctLocal") : cloudLoggedIn ? (cloudUser?.email ?? tr("authLoginBtn")) : tr("authLoginBtn")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>
            {localMode
              ? tr("acctLocalSub")
              : cloudLoggedIn
                ? tr("acctTrial")
                : tr("catalogSubLogin")}
          </p>
        </div>
        {cloudLoggedIn ? (
          <button className="btn-outlined" type="button" onClick={() => setView("plan")}>
            {tr("managePlan")}
          </button>
        ) : localMode ? (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
            <button className="btn-primary" type="button" onClick={() => openSignIn("login")}>
              {tr("localModeSignIn")}
            </button>
            <button className="btn-outlined" type="button" onClick={() => setView("sources")}>
              {tr("localModeSetupKeys")}
            </button>
          </div>
        ) : (
          <button className="btn-outlined" type="button" onClick={() => openSignIn("login")}>
            {tr("setSignInBtn")}
          </button>
        )}
      </div>
      {cloudLoggedIn && (
        <div className="setting">
          <div>
            <h4>{tr("setLogout")}</h4>
          </div>
          <button
            className="btn-outlined"
            type="button"
            onClick={() => void signOutWithCloud()}
          >
            {tr("logoutBtn")}
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
        <Switch on={Boolean(proxy?.running)} onToggle={() => {}} disabled />
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
          value={replyLang}
          onChange={(e) => {
            const next = e.target.value as ReplyLang;
            setReplyLang(next);
            saveUserPrefs({ replyLang: next });
          }}
        >
          <option value="zh">{lang === "zh" ? "中文" : "Chinese"}</option>
          <option value="en">{lang === "zh" ? "英文" : "English"}</option>
          <option value="bilingual">{lang === "zh" ? "中英混合" : "Mixed"}</option>
        </select>
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setCrossMem")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setCrossMemSub")}</p>
        </div>
        <Switch
          on={bonus.memory_inject && sw.crossMem}
          onToggle={() => {
            const nextMem = !sw.crossMem;
            setSw((s) => ({ ...s, crossMem: nextMem }));
            void pushBonus({ ...bonus, memory_inject: nextMem });
          }}
        />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setAgentMemoryWrite")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setAgentMemoryWriteSub")}</p>
        </div>
        <Switch
          on={Boolean(bonus.external_memory_write)}
          onToggle={() =>
            void pushBonus({
              ...bonus,
              external_memory_write: !bonus.external_memory_write,
            })
          }
        />
      </div>

      <div className="setting-group">{tr("setGrpRoute")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setSmartRoute")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setSmartRouteSub")}</p>
        </div>
        <Switch on={smartRouteEnabled} onToggle={toggleSmartRoute} />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setByokRoute")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setByokRouteSub")}</p>
        </div>
        <Switch
          on={Boolean(bonus.byok_route)}
          onToggle={() => void pushBonus({ ...bonus, byok_route: !bonus.byok_route })}
        />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setFailover")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setFailoverSub")}</p>
        </div>
        <Switch
          on={bonus.failover && sw.failover}
          onToggle={() => {
            const next = !sw.failover;
            setSw((s) => ({ ...s, failover: next }));
            void pushBonus({ ...bonus, failover: next });
          }}
        />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setHybridFb")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setHybridFbSub")}</p>
        </div>
        <Switch
          on={sw.hybridFb}
          onToggle={() => {
            if (sw.hybridFb) {
              saveHybridFallback(false, false);
              setSw((s) => ({ ...s, hybridFb: false }));
              return;
            }
            if (!window.confirm(tr("setHybridFbConfirm"))) return;
            saveHybridFallback(true, true);
            setSw((s) => ({ ...s, hybridFb: true }));
          }}
        />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setTranslator")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setTranslatorSub")}</p>
        </div>
        <Switch
          on={bonus.format_translate !== false}
          onToggle={() =>
            void pushBonus({
              ...bonus,
              format_translate: bonus.format_translate === false,
            })
          }
        />
      </div>

      <div className="setting-group">{tr("setGrpSave")}</div>
      <div className="setting">
        <div>
          <h4>{tr("setCompress")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setCompressSub")}</p>
        </div>
        <Switch
          on={bonus.rtk}
          onToggle={() => void pushBonus({ ...bonus, rtk: !bonus.rtk })}
        />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setConcise")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setConciseSub")}</p>
        </div>
        <Switch
          on={bonus.caveman_level >= 1}
          onToggle={() =>
            void pushBonus({
              ...bonus,
              caveman_level: bonus.caveman_level >= 1 ? 0 : 1,
            })
          }
        />
      </div>
      <div className="setting">
        <div>
          <h4>{tr("setBudgetAlert")}</h4>
          <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setBudgetAlertSub")}</p>
        </div>
        <Switch
          on={bonus.budget_alert !== false}
          onToggle={() =>
            void pushBonus({
              ...bonus,
              budget_alert: bonus.budget_alert === false,
            })
          }
        />
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
            <Switch on={agentEnabled} onToggle={() => setAgentEnabled(!agentEnabled)} />
          </div>
          <div className="setting">
            <div>
              <h4>{tr("setPrune")}</h4>
              <p style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("setPruneSub")}</p>
            </div>
            <Switch
              on={bonus.prune}
              onToggle={() => void pushBonus({ ...bonus, prune: !bonus.prune })}
            />
          </div>
        </div>
      )}
    </PageScroll>
  );
}
