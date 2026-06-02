import { useApp } from "../state/AppContext";

export function CatalogLoading() {
  const { tr } = useApp();

  return (
    <div className="catalog-loading" role="status" aria-live="polite">
      <div className="catalog-loading-spinner" aria-hidden />
      <strong>{tr("catalogLoadingTitle")}</strong>
      <p>{tr("catalogLoadingSub")}</p>
    </div>
  );
}
