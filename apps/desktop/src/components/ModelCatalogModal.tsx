import { useEffect, useMemo, useState } from "react";
import type { I18nKey } from "../i18n";
import {
  buildCatalogSections,
  catalogModelPool,
  catalogProviders,
  CATALOG_TYPES,
  findCatalogModel,
  fmtCtx,
  loadFavModels,
  loadRecentModels,
  providerColor,
  pushRecentModel,
  saveFavModels,
  toggleFavModel,
  type CatalogSort,
  type CatalogType,
} from "../lib/catalog";
import { fmtModelPrice } from "../lib/route";
import { useApp } from "../state/AppContext";
import { Modal } from "./ui/Modal";

const CAP_KEY: Record<string, I18nKey> = {
  tools: "capTools",
  vision: "capVision",
  reason: "capReason",
  long: "capLong",
};

const TYPE_KEY: Record<string, I18nKey> = {
  all: "catTypeAll",
  lang: "modelTypeLang",
  image: "modelTypeImage",
  video: "modelTypeVideo",
  embed: "modelTypeEmbed",
};

interface ModelCatalogModalProps {
  open: boolean;
  onClose: () => void;
}

export function ModelCatalogModal({ open, onClose }: ModelCatalogModalProps) {
  const { lang, tr, smartRouteEnabled, activeGatewayModel, selectGatewayModel, selectIntent, showToast, gatewayCatalog, gatewayLive, gatewayHealth, cloudSession, cloudConfigured, openAuth } =
    useApp();

  const [query, setQuery] = useState("");
  const [catalogType, setCatalogType] = useState<CatalogType>("all");
  const [catalogProvider, setCatalogProvider] = useState("all");
  const [sort, setSort] = useState<CatalogSort>("featured");
  const [favs, setFavs] = useState<string[]>([]);
  const [recents, setRecents] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setQuery("");
    setCatalogType("all");
    setCatalogProvider("all");
    setSort("featured");
    setFavs(loadFavModels());
    setRecents(loadRecentModels());
  }, [open]);

  const providers = useMemo(
    () => catalogProviders(catalogType, gatewayCatalog, cloudConfigured),
    [catalogType, gatewayCatalog, cloudConfigured],
  );
  const modelPool = useMemo(() => catalogModelPool(gatewayCatalog, cloudConfigured), [gatewayCatalog, cloudConfigured]);
  const sections = useMemo(
    () =>
      buildCatalogSections(query, catalogType, catalogProvider, sort, favs, recents, gatewayCatalog, cloudConfigured),
    [query, catalogType, catalogProvider, sort, favs, recents, gatewayCatalog, cloudConfigured],
  );

  const pickModel = (id: string) => {
    pushRecentModel(id);
    selectGatewayModel(id);
    onClose();
    const m = findCatalogModel(id, gatewayCatalog);
    showToast(tr("toastModelPinned").replace("{m}", m?.displayName[lang] || id));
  };

  return (
    <Modal open={open} onClose={onClose} sheetClassName="catalog-sheet">
      <div className="modal-head">
        <div>
          <h3>{tr("catalogTitle")}</h3>
          <p className="catalog-head-sub">
            {gatewayLive
              ? tr("catalogSub")
              : !gatewayHealth?.configured
                ? tr("catalogSubOffline")
                : !cloudSession
                  ? tr("catalogSubLogin")
                  : tr("catalogSubPending")}
          </p>
          {!gatewayLive && (
            <p className="catalog-head-sub" style={{ color: "var(--warning)", marginTop: 4 }}>
              {!cloudSession ? tr("catalogLoginHint") : tr("catalogEnvHint")}
            </p>
          )}
          {!gatewayLive && !cloudSession && gatewayHealth?.configured && (
            <button
              type="button"
              className="btn-primary"
              style={{ marginTop: 12 }}
              onClick={() => {
                openAuth("login");
                onClose();
              }}
            >
              {tr("catalogLoginBtn")}
            </button>
          )}
        </div>
        <button className="modal-close" type="button" onClick={onClose} aria-label="close">
          <span className="material-symbols-outlined">close</span>
        </button>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-controls">
          <div className="catalog-search">
            <span className="material-symbols-outlined">search</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={tr("catalogSearchPh")}
              autoComplete="off"
            />
            {query && (
              <button type="button" className="catalog-search-clear" aria-label="clear" onClick={() => setQuery("")}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
                  close
                </span>
              </button>
            )}
          </div>
          <select
            className="catalog-sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as CatalogSort)}
            aria-label="sort"
          >
            <option value="featured">{tr("catSortFeatured")}</option>
            <option value="cheap">{tr("catSortCheap")}</option>
            <option value="fast">{tr("catSortFast")}</option>
            <option value="context">{tr("catSortContext")}</option>
          </select>
        </div>
        <div className="catalog-providers" role="toolbar" aria-label={tr("catProvAll")}>
          <button
            type="button"
            className={`cat-prov${catalogProvider === "all" ? " active" : ""}`}
            onClick={() => setCatalogProvider("all")}
          >
            {tr("catProvAll")}
          </button>
          {providers.map((p) => (
            <button
              key={p}
              type="button"
              className={`cat-prov${catalogProvider === p ? " active" : ""}`}
              onClick={() => setCatalogProvider(p)}
            >
              <span
                className="cat-prov-badge"
                style={{
                  background: `color-mix(in srgb, ${providerColor(p)} 22%, var(--surface-highest))`,
                  color: providerColor(p),
                }}
              >
                {p.slice(0, 1)}
              </span>
              {p}
            </button>
          ))}
        </div>
        <div className="catalog-types">
          {CATALOG_TYPES.map((ty) => {
            const n = ty === "all" ? modelPool.length : modelPool.filter((m) => m.type === ty).length;
            return (
              <button
                key={ty}
                type="button"
                className={`cat-type${catalogType === ty ? " active" : ""}`}
                onClick={() => {
                  setCatalogType(ty);
                }}
              >
                {tr(TYPE_KEY[ty])}
                <span className="cat-type-n">{n}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="catalog-list">
        {sections.length === 0 ? (
          <div className="cat-empty">{tr("catNoResult")}</div>
        ) : (
          sections.map((sec, si) => (
            <div key={si}>
              {sec.titleKey && (
                <div className="cat-group">
                  {tr(sec.titleKey as I18nKey)}
                  {sec.titleKey === "catAll" && sec.count != null ? ` · ${sec.count}` : ""}
                </div>
              )}
              {!sec.titleKey && sec.count != null && (
                <div className="cat-group">
                  {sec.count} {tr("catResults")}
                </div>
              )}
              {sec.models.map((m) => {
                const fav = favs.includes(m.id);
                const active = !smartRouteEnabled && m.id === activeGatewayModel;
                const c = providerColor(m.provider);
                return (
                  <div key={m.id} className={`cat-row${active ? " active" : ""}`}>
                    <button type="button" className="cat-row-main" onClick={() => pickModel(m.id)}>
                      <span
                        className="cat-prov-badge"
                        style={{
                          background: `color-mix(in srgb, ${c} 22%, var(--surface-highest))`,
                          color: c,
                        }}
                      >
                        {m.provider.slice(0, 1)}
                      </span>
                      <span className="cat-row-info">
                        <span className="cat-row-name">
                          {m.displayName[lang]}
                          {active && (
                            <>
                              {" "}
                              <span className="cat-row-pinned">{tr("catPinned")}</span>
                            </>
                          )}
                        </span>
                        <span className="cat-row-id mono">{m.id}</span>
                        <span className="cat-row-tags">
                          {"ctx" in m && m.ctx ? <span className="cat-badge">{fmtCtx(m.ctx)}</span> : null}
                          {(m.caps || []).map((cap) => (
                            <span key={cap} className="cat-cap">
                              {tr(CAP_KEY[cap] ?? "capTools")}
                            </span>
                          ))}
                        </span>
                      </span>
                      <span className="cat-row-price mono">{fmtModelPrice(lang, m)}</span>
                    </button>
                    <button
                      type="button"
                      className={`cat-fav${fav ? " on" : ""}`}
                      aria-label="favorite"
                      onClick={(e) => {
                        e.stopPropagation();
                        const next = toggleFavModel(m.id);
                        setFavs(next);
                        saveFavModels(next);
                      }}
                    >
                      <span className={`material-symbols-outlined${fav ? " filled" : ""}`}>star</span>
                    </button>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>
      <div className="catalog-foot">
        <button
          type="button"
          className="catalog-auto-btn"
          onClick={() => {
            selectIntent("auto");
            onClose();
          }}
        >
          <span className="material-symbols-outlined">auto_awesome</span>
          <span>{tr("catalogAuto")}</span>
        </button>
      </div>
    </Modal>
  );
}
