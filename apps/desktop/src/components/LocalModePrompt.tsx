import type { I18nKey } from "../i18n";
import { useApp } from "../state/AppContext";

type LocalModePromptProps = {
  subKey?: I18nKey;
  compact?: boolean;
};

export function LocalModePrompt({
  subKey = "localModePromptSub",
  compact = false,
}: LocalModePromptProps) {
  const { tr, openSignIn, setView } = useApp();

  return (
    <div className={`login-prompt local-mode-prompt${compact ? " login-prompt--compact" : ""}`}>
      <div className="login-prompt-icon" aria-hidden>
        <span className="material-symbols-outlined">offline_pin</span>
      </div>
      <div className="login-prompt-body">
        <strong>{tr("modeLocalTitle")}</strong>
        <p>{tr(subKey)}</p>
        <div className="login-prompt-actions">
          <button type="button" className="btn-primary" onClick={() => openSignIn("login")}>
            {tr("localModeSignIn")}
          </button>
          <button type="button" className="btn-outlined" onClick={() => setView("sources")}>
            {tr("localModeSetupKeys")}
          </button>
        </div>
      </div>
    </div>
  );
}
