import { PRODUCT_INTENTS } from "../lib/product/intents";
import { catalogModelPool, findCatalogModel, featuredModelsFromCatalog } from "../lib/catalog";
import {
  MODEL_TYPE_ICON,
  fmtModelPrice,
  intentLabel,
  resolvedModelForRoute,
} from "../lib/route";
import { useApp } from "../state/AppContext";

export function ModelsView() {
  const {
    lang,
    tr,
    smartRouteEnabled,
    activeIntent,
    activeGatewayModel,
    routeApplying,
    toggleSmartRoute,
    selectIntent,
    selectGatewayModel,
    routeAppCount,
    setCatalogOpen,
    gatewayCatalog,
    cloudConfigured,
    gatewayLive,
  } = useApp();

  const modelPool = catalogModelPool(gatewayCatalog, cloudConfigured);
  const pinnedModels = gatewayLive ? featuredModelsFromCatalog(modelPool, 6) : [];

  const autoMode = smartRouteEnabled && activeIntent === "auto";
  const resolved = smartRouteEnabled
    ? resolvedModelForRoute(
        { smartRouteEnabled, activeIntent, activeGatewayModel },
        gatewayCatalog,
        cloudConfigured,
      )
    : findCatalogModel(activeGatewayModel, gatewayCatalog, cloudConfigured);

  const title = autoMode
    ? tr("autoRouteTitle")
    : smartRouteEnabled
      ? intentLabel(lang, activeIntent)
      : resolved?.displayName[lang] ?? activeGatewayModel;

  const sub = autoMode
    ? tr("autoRouteSub")
    : smartRouteEnabled && resolved
      ? resolved.displayName[lang]
      : !smartRouteEnabled && PRODUCT_INTENTS.find((i) => i.id === activeIntent)
        ? intentLabel(lang, activeIntent)
        : null;

  const liveLbl = routeApplying
    ? tr("routeApplying")
    : smartRouteEnabled
      ? tr("vpnConnected")
      : tr("vpnLiveFixed");

  return (
    <div className="models-vpn-page">
      <div className="vpn-page-bg" aria-hidden>
        <span className="bg-orb o1" />
        <span className="bg-orb o2" />
      </div>
      <div className="vpn-hero-col">
        <div
          className={`vpn-connect-hero live${routeApplying ? " route-applying" : ""}`}
          id="vpnStatusCard"
        >
          <div className="vpn-power-ring" aria-hidden>
            <span className="material-symbols-outlined">shield</span>
          </div>
          <p className="vpn-state-lbl">
            <span className="vpn-status-dot" />
            <span>{liveLbl}</span>
          </p>
          <h1 className="vpn-route-title">{title}</h1>
          {sub && <p className="vpn-route-model">{sub}</p>}
          {!routeApplying && (
            <p className="vpn-synced-line">
              {tr("vpnSyncedApps").replace("{n}", String(routeAppCount))}
            </p>
          )}
        </div>
        <div className="vpn-smart-row">
          <span className="vpn-smart-row-text">
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: "var(--savings)" }}>
              auto_awesome
            </span>
            <span>
              <span>{tr("smartRouteTitle")}</span>
              <small>{tr("smartRouteHint")}</small>
            </span>
          </span>
          <button
            type="button"
            className={`toggle-smart${smartRouteEnabled ? " on" : ""}`}
            aria-pressed={smartRouteEnabled}
            onClick={toggleSmartRoute}
          />
        </div>
      </div>
      <div className="vpn-list-col">
        <div className="section-label-sm">
          {smartRouteEnabled ? tr("vpnListSmart") : tr("vpnListFixed")}
        </div>
        <div className="vpn-node-list">
          {smartRouteEnabled ? (
            <>
              <button
                type="button"
                className={`vpn-node-row auto${activeIntent === "auto" ? " active" : ""}`}
                onClick={() => selectIntent("auto")}
              >
                <span className="material-symbols-outlined">auto_awesome</span>
                <span className="vpn-node-text">
                  <span className="vpn-node-name">
                    {tr("autoNodeName")}
                    <span className="vpn-node-badge">{tr("autoNodeBadge")}</span>
                  </span>
                  <span className="vpn-node-sub">{tr("autoNodeSub")}</span>
                </span>
                {activeIntent === "auto" ? (
                  <span className="material-symbols-outlined vpn-node-check">check_circle</span>
                ) : (
                  <span className="vpn-node-check" aria-hidden />
                )}
              </button>
              <div className="vpn-scene-label">{tr("vpnSceneLabel")}</div>
              {PRODUCT_INTENTS.map((i) => {
                const m = findCatalogModel(i.defaultModel, gatewayCatalog, cloudConfigured);
                const active = i.id === activeIntent;
                return (
                  <button
                    key={i.id}
                    type="button"
                    className={`vpn-node-row${active ? " active" : ""}`}
                    onClick={() => selectIntent(i.id)}
                  >
                    <span className="material-symbols-outlined">{i.icon}</span>
                    <span className="vpn-node-text">
                      <span className="vpn-node-name">{intentLabel(lang, i.id)}</span>
                      <span className="vpn-node-sub">{m ? m.displayName[lang] : ""}</span>
                    </span>
                    {active ? (
                      <span className="material-symbols-outlined vpn-node-check">check_circle</span>
                    ) : (
                      <span className="vpn-node-check" aria-hidden />
                    )}
                  </button>
                );
              })}
            </>
          ) : (
            pinnedModels.map((m) => {
              const id = m.id;
              const active = id === activeGatewayModel;
              return (
                <button
                  key={id}
                  type="button"
                  className={`vpn-node-row${active ? " active" : ""}`}
                  onClick={() => selectGatewayModel(id)}
                >
                  <span className="material-symbols-outlined">
                    {MODEL_TYPE_ICON[m.type] ?? "psychology"}
                  </span>
                  <span className="vpn-node-text">
                    <span className="vpn-node-name">{m.displayName[lang]}</span>
                    <span className="vpn-node-sub">{fmtModelPrice(lang, m)}</span>
                  </span>
                  {active ? (
                    <span className="material-symbols-outlined vpn-node-check">check_circle</span>
                  ) : (
                    <span className="vpn-node-check" aria-hidden />
                  )}
                </button>
              );
            })
          )}
        </div>
        <button type="button" className="models-browse-btn" onClick={() => setCatalogOpen(true)}>
          <span className="material-symbols-outlined">tune</span>
          <span className="models-browse-text">
            <span>{tr("modelsBrowse")}</span>
            <small>{tr("modelsBrowseSub")}</small>
          </span>
          <span className="models-browse-count mono">{modelPool.length}+</span>
        </button>
      </div>
    </div>
  );
}
