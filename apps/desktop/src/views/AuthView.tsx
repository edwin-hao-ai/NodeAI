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

            <div className="divider">{tr("authOr")}</div>
            <div className="oauth-row">
              <button type="button" className="oauth-btn" onClick={() => showToast(tr("authOAuthSoon"))}>
                <span className="oauth-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="none">
                    <path
                      d="M21.6 12.227c0-.709-.064-1.39-.182-2.045H12v3.868h5.382a4.637 4.637 0 0 1-2.009 3.045v2.518h3.255c1.905-1.755 3.009-4.338 3.009-7.386z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 22c2.7 0 4.964-.895 6.618-2.436l-3.255-2.518c-.895.6-2.04.955-3.363.955-2.586 0-4.777-1.745-5.559-4.091H3.191v2.6A9.996 9.996 0 0 0 12 22z"
                      fill="#34A853"
                    />
                    <path
                      d="M6.441 13.91A5.995 5.995 0 0 1 6.027 12c0-.664.114-1.309.314-1.91V7.49H3.191A9.996 9.996 0 0 0 2 12c0 .664.114 1.309.314 1.91l3.127-2.09z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.773c1.473 0 2.791.509 3.832 1.505l2.873-2.873C16.959 2.773 14.7 2 12 2 7.709 2 4.091 4.473 3.191 7.49l3.25 2.6C7.223 7.518 9.414 5.773 12 5.773z"
                      fill="#EA4335"
                    />
                  </svg>
                </span>
                Google
              </button>
              <button type="button" className="oauth-btn" onClick={() => showToast(tr("authOAuthSoon"))}>
                <span className="oauth-icon" aria-hidden>
                  <svg viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0 0 22 12.017C22 6.484 17.522 2 12 2z" />
                  </svg>
                </span>
                GitHub
              </button>
            </div>

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
