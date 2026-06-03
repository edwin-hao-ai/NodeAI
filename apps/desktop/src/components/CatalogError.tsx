import type { I18nKey } from "../i18n";
import { useApp } from "../state/AppContext";

type CatalogErrorProps = {
  onRetry: () => void;
  onSignIn?: () => void;
};

export function CatalogError({ onRetry, onSignIn }: CatalogErrorProps) {
  const { tr, catalogError } = useApp();

  const titleKey: I18nKey =
    catalogError === "auth"
      ? "catalogErrorAuthTitle"
      : catalogError === "registry"
        ? "catalogErrorRegistryTitle"
        : "catalogErrorNetworkTitle";

  const subKey: I18nKey =
    catalogError === "auth"
      ? "catalogErrorAuthSub"
      : catalogError === "registry"
        ? "catalogErrorRegistrySub"
        : "catalogErrorNetworkSub";

  return (
    <div className="catalog-error" role="alert">
      <span className="material-symbols-outlined" style={{ fontSize: 32, color: "var(--warning)" }}>
        cloud_off
      </span>
      <strong>{tr(titleKey)}</strong>
      <p>{tr(subKey)}</p>
      <div className="catalog-error-actions">
        <button type="button" className="btn-primary" onClick={onRetry}>
          {tr("catalogRetry")}
        </button>
        {catalogError === "auth" && onSignIn && (
          <button type="button" className="btn-outlined" onClick={onSignIn}>
            {tr("catalogLoginBtn")}
          </button>
        )}
      </div>
    </div>
  );
}
