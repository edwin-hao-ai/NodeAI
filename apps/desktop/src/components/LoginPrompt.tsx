import type { I18nKey } from "../i18n";
import { useApp } from "../state/AppContext";

type LoginPromptProps = {
  titleKey?: I18nKey;
  subKey?: I18nKey;
  compact?: boolean;
  showByok?: boolean;
};

export function LoginPrompt({
  titleKey = "loginPromptTitle",
  subKey = "loginPromptSub",
  compact = false,
  showByok = true,
}: LoginPromptProps) {
  const { tr, openSignIn, enterLocalMode } = useApp();

  return (
    <div className={`login-prompt${compact ? " login-prompt--compact" : ""}`}>
      <div className="login-prompt-icon" aria-hidden>
        <span className="material-symbols-outlined">account_circle</span>
      </div>
      <div className="login-prompt-body">
        <strong>{tr(titleKey)}</strong>
        <p>{tr(subKey)}</p>
        <div className="login-prompt-actions">
          <button type="button" className="btn-primary" onClick={() => openSignIn("login")}>
            {tr("authLoginBtn")}
          </button>
          <button type="button" className="btn-outlined" onClick={() => openSignIn("register")}>
            {tr("authRegisterLink")}
          </button>
          {showByok && (
            <button type="button" className="login-prompt-link" onClick={() => enterLocalMode()}>
              {tr("authByokOnlyFull")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
