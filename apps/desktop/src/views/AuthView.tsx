import { useState } from "react";
import { BrandMark } from "../components/BrandMark";
import { useApp } from "../state/AppContext";

const HERO_VALUES = [
  { icon: "chat", titleKey: "authVal1t", descKey: "authVal1d" },
  { icon: "hub", titleKey: "authVal2t", descKey: "authVal2d" },
  { icon: "savings", titleKey: "authVal3t", descKey: "authVal3d" },
  { icon: "neurology", titleKey: "authVal4t", descKey: "authVal4d" },
] as const;

export function AuthView() {
  const { tr, lang, toggleLang, closeAuth, signInWithCloud, signUpWithCloud, enterLocalMode, showToast } =
    useApp();
  const [mode, setMode] = useState<"login" | "register">(
    () => (sessionStorage.getItem("nodeai-auth-mode") as "login" | "register") || "login",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  const finish = async () => {
    if (!email.trim()) {
      showToast(tr("authEmailRequired"));
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        await signUpWithCloud(email.trim(), password, name.trim() || undefined);
      } else {
        await signInWithCloud(email.trim(), password);
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-screen">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">
            <BrandMark size={20} />
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
      </header>

      <div className="layout">
        <aside className="hero-panel">
          <h1>{tr("authHeroTitle")}</h1>
          <p>{tr("authHeroSubLong")}</p>
          <div className="value-list">
            {HERO_VALUES.map((item) => (
              <div key={item.icon} className="value-item">
                <div className="value-icon">
                  <span className="material-symbols-outlined">{item.icon}</span>
                </div>
                <div>
                  <strong>{tr(item.titleKey)}</strong>
                  <span>{tr(item.descKey)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="roi-card">
            <div style={{ fontSize: 12, color: "var(--on-surface-variant)" }}>{tr("authRoiLbl")}</div>
            <div className="roi-big mono">{tr("authRoiBig")}</div>
            <div className="roi-sub">{tr("authRoiSub")}</div>
          </div>
        </aside>

        <main>
          <div className="auth-card">
            <div className="auth-head">
              <h2>{mode === "login" ? tr("authLoginTitleFull") : tr("authRegTitle")}</h2>
              <p>{mode === "login" ? tr("authLoginSubFull") : tr("authRegSub")}</p>
            </div>

            {mode === "register" && (
              <div className="field">
                <label>{tr("authName")}</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  placeholder={tr("authNamePh")}
                />
              </div>
            )}

            <div className="field">
              <label>{tr("authEmail")}</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="field">
              <label>{tr("authPassword")}</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={mode === "login" ? "current-password" : "new-password"}
              />
            </div>

            {mode === "login" && (
              <div className="field-row">
                <label className="check-row">
                  <input type="checkbox" defaultChecked readOnly />
                  <span>{tr("authRemember")}</span>
                </label>
                <button type="button" className="link" onClick={() => showToast(tr("authForgotSoon"))}>
                  {tr("authForgot")}
                </button>
              </div>
            )}

            <button type="button" className="btn-primary" onClick={() => void finish()} disabled={busy}>
              <span>{mode === "login" ? tr("authLoginBtn") : tr("authRegBtn")}</span>
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>

            <p className="auth-foot">
              {mode === "login" ? (
                <>
                  {tr("authNoAccount")}{" "}
                  <button type="button" className="link" onClick={() => setMode("register")}>
                    {tr("authRegisterLink")}
                  </button>
                </>
              ) : (
                <>
                  {tr("authHasAccount")}{" "}
                  <button type="button" className="link" onClick={() => setMode("login")}>
                    {tr("authGoLogin")}
                  </button>
                </>
              )}
            </p>

            <div className="divider">{tr("authOr")}</div>
            <div className="oauth-row">
              <button type="button" className="oauth-btn" onClick={() => showToast(tr("authOAuthSoon"))}>
                <span className="material-symbols-outlined">account_circle</span>
                Google
              </button>
              <button type="button" className="oauth-btn" onClick={() => showToast(tr("authOAuthSoon"))}>
                <span className="material-symbols-outlined">code</span>
                GitHub
              </button>
            </div>

            <div className="divider">{tr("authOr")}</div>
            <button
              type="button"
              className="btn-outlined"
              onClick={() => {
                enterLocalMode();
                closeAuth();
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                offline_pin
              </span>
              {tr("authByokOnlyFull")}
            </button>
            <p className="auth-hint">{tr("authByokHint")}</p>
          </div>
        </main>
      </div>
    </div>
  );
}
