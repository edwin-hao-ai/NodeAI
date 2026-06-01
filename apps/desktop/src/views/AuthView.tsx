import { useState } from "react";
import { useApp } from "../state/AppContext";

export function AuthView() {
  const { tr, lang, toggleLang, openAuth, closeAuth, loginDemo } = useApp();
  const [mode, setMode] = useState<"login" | "register">(
    () => (sessionStorage.getItem("nodeai-auth-mode") as "login" | "register") || "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const finish = () => {
    loginDemo();
  };

  return (
    <div className="auth-screen">
      <div className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <span className="material-symbols-outlined">shield</span>
          </div>
          NodeAI
        </div>
        <div className="top-actions">
          <button type="button" className="ghost-btn" onClick={toggleLang}>
            {lang === "zh" ? "EN" : "中文"}
          </button>
          <button type="button" className="ghost-btn" onClick={closeAuth}>
            {tr("connectLater")}
          </button>
        </div>
      </div>
      <div className="layout">
        <div className="hero-panel">
          <h1>{tr("authHeroTitle")}</h1>
          <p>{tr("authHeroSub")}</p>
          <div className="roi-card">
            <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("planRoiSaved")}</div>
            <div className="roi-big mono">+¥191</div>
            <div className="roi-sub">{tr("planRoiFoot")}</div>
          </div>
        </div>
        <div className="auth-card">
          <div className="auth-head">
            <h2>{mode === "login" ? tr("authLoginTitle") : tr("authRegTitle")}</h2>
            <p>{tr("authLoginSub")}</p>
          </div>
          <div className="field">
            <label>{tr("authEmail")}</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          </div>
          <div className="field">
            <label>{tr("authPassword")}</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          <button type="button" className="btn-primary" onClick={finish}>
            {mode === "login" ? tr("authLoginBtn") : tr("authRegBtn")}
          </button>
          <div className="auth-foot">
            {mode === "login" ? (
              <button type="button" className="link" onClick={() => setMode("register")}>
                {tr("authGoReg")}
              </button>
            ) : (
              <button type="button" className="link" onClick={() => setMode("login")}>
                {tr("authGoLogin")}
              </button>
            )}
          </div>
          <div className="divider">{tr("authOr")}</div>
          <div className="oauth-row">
            <button type="button" className="oauth-btn" onClick={finish}>
              Google
            </button>
            <button type="button" className="oauth-btn" onClick={finish}>
              GitHub
            </button>
          </div>
          <button type="button" className="btn-outlined" style={{ marginTop: 12 }} onClick={() => openAuth("register")}>
            {tr("authByokOnly")}
          </button>
        </div>
      </div>
    </div>
  );
}
