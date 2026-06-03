import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import {
  createMemory,
  fetchMemories,
  type MemoryItem,
  type MemoryTag,
} from "../lib/memoryStore";
import {
  countConnectedApps,
  getRouteLineShort,
  isCursorConnected,
  type RouteState,
} from "../lib/route";
import { fetchGatewayCatalog, fetchGatewayHealth, isLiveGatewayCatalog, waitForGatewayReady, type GatewayCatalogEntry, type CloudHealth } from "../lib/gateway";
import { checkBudgetAlerts } from "../lib/budgetAlert";
import { fetchUsageSnapshot, loadBonusProfileLocal, saveBonusProfileLocal, syncBonusProfile, type UsageSnapshot } from "../lib/bonusApi";
import {
  loadStoredCloudUser,
  saveStoredCloudUser,
  signInViaProxy,
  registerViaProxy,
  clearStoredCloudUser,
  validateCloudSessionViaProxy,
  type CloudUser,
} from "../lib/cloudAuth";
import { clearCloudSession, getCloudSession, saveCloudSession } from "../lib/cloudSession";
import { ensureCloudDev, isCloudConnectivityAuthError } from "../lib/cloudDev";
import { findProductIntent, PRODUCT_INTENTS } from "../lib/product/intents";
import { syncModelSources } from "../lib/sourcesSync";
import { syncNativeTrayMenu } from "../lib/traySync";
import { findCatalogModel } from "../lib/catalog";
import { type I18nKey, type Lang, t } from "../i18n";

export type ViewId =
  | "models"
  | "chat"
  | "hub"
  | "gateway"
  | "memory"
  | "sources"
  | "billing"
  | "plan"
  | "settings"
  | "auth";

export type AuthMode = "login" | "register";

export interface ModelSource {
  id: string;
  name: string;
  url: string;
  format: string;
  hasKey: boolean;
}

export interface ProxyStatus {
  running: boolean;
  listen_addr: string;
  base_url: string;
}

interface AppContextValue extends RouteState {
  lang: Lang;
  theme: string;
  view: ViewId;
  proxy: ProxyStatus | null;
  gatewayPort: number;
  gatewayBaseUrl: string;
  gatewayCatalog: GatewayCatalogEntry[] | null;
  gatewayHealth: CloudHealth | null;
  gatewayLive: boolean;
  cloudConfigured: boolean;
  cloudReachable: boolean;
  usageSnapshot: UsageSnapshot | null;
  cursorConnected: boolean;
  localMode: boolean;
  enterLocalMode: () => void;
  exitLocalMode: () => void;
  openSignIn: (mode?: AuthMode) => void;
  cloudSession: string | null;
  cloudUser: CloudUser | null;
  cloudLoggedIn: boolean;
  authReady: boolean;
  needsCloudLogin: boolean;
  catalogLoading: boolean;
  roiBannerHidden: boolean;
  connectBannerHidden: boolean;
  onboardDismissed: boolean;
  firstChatDone: boolean;
  viewSavingsDone: boolean;
  memories: MemoryItem[];
  modelSources: ModelSource[];
  celebrateOpen: boolean;
  catalogOpen: boolean;
  addAppOpen: boolean;
  sourceModalOpen: boolean;
  workspacePaths: string[];
  toast: string | null;
  setView: (view: ViewId) => void;
  toggleLang: () => void;
  setTheme: (theme: string) => void;
  toggleSmartRoute: () => void;
  selectIntent: (id: string) => void;
  selectGatewayModel: (id: string) => void;
  setGatewayPort: (port: number) => void;
  dismissRoiBanner: () => void;
  dismissConnectBanner: () => void;
  dismissOnboard: () => void;
  markFirstChatDone: () => void;
  markViewSavings: () => void;
  rememberText: (text: string, tag?: MemoryTag) => void;
  addMemoryManual: (text: string, tag: MemoryTag) => void;
  addModelSource: (source: ModelSource) => void;
  showCelebrate: () => void;
  hideCelebrate: () => void;
  setCatalogOpen: (v: boolean) => void;
  setAddAppOpen: (v: boolean) => void;
  setSourceModalOpen: (v: boolean) => void;
  cycleWorkspace: () => void;
  setWorkspace: (path: string) => void;
  openAuth: (mode: AuthMode) => void;
  closeAuth: () => void;
  signInWithCloud: (email: string, password: string) => Promise<boolean>;
  signUpWithCloud: (email: string, password: string, name?: string) => Promise<boolean>;
  signOutWithCloud: () => Promise<void>;
  showToast: (msg: string) => void;
  tr: (key: I18nKey) => string;
  routeLine: string;
  routeApplying: boolean;
  routeAppCount: number;
  workspace: string;
  agentEnabled: boolean;
  setAgentEnabled: (on: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_LANG = "nodeai-lang";
const STORAGE_THEME = "nodeai-theme";
const STORAGE_ROUTE = "nodeai-route";
const STORAGE_PORT = "nodeai-gateway-port";
const STORAGE_ROI = "nodeai-roi-hidden";
const STORAGE_CONNECT_BANNER = "nodeai-connect-banner-hidden";
const STORAGE_ONBOARD = "nodeai-onboard-dismissed";
const STORAGE_FIRST_CHAT = "nodeai-first-chat-done";
const STORAGE_VIEW_SAVINGS = "nodeai-onboard-steps";
const STORAGE_WS = "nodeai-workspace";
const STORAGE_AGENT = "nodeai-agent-enabled";
const STORAGE_SOURCES = "nodeai-sources";
const STORAGE_LOCAL_MODE = "nodeai-local-mode";
const WS_DEMO_PATHS = ["~/Documents/NodeAI", "~/Projects/my-app", "~/Desktop/工作"];
const DEFAULT_PORT = 8787;

function loadViewSavingsDone(): boolean {
  try {
    const done = JSON.parse(localStorage.getItem(STORAGE_VIEW_SAVINGS) || "{}") as Record<string, boolean>;
    return Boolean(done.viewSavings);
  } catch {
    return false;
  }
}

function loadModelSources(): ModelSource[] {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_SOURCES) || "[]");
    if (Array.isArray(raw) && raw.length) return raw;
  } catch {
    /* ignore */
  }
  return [];
}

function loadRoute(): Pick<RouteState, "smartRouteEnabled" | "activeGatewayModel" | "activeIntent"> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_ROUTE) || "null");
    if (raw && typeof raw === "object") {
      return {
        smartRouteEnabled: raw.smartRouteEnabled !== false,
        activeGatewayModel: raw.activeGatewayModel || "google/gemini-2.5-flash",
        activeIntent: raw.activeIntent || "auto",
      };
    }
  } catch {
    /* ignore */
  }
  return {
    smartRouteEnabled: true,
    activeGatewayModel: "google/gemini-2.5-flash",
    activeIntent: "auto",
  };
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>(
    () => (localStorage.getItem(STORAGE_LANG) as Lang) || "zh",
  );
  const [theme, setThemeState] = useState(
    () => localStorage.getItem(STORAGE_THEME) || "forest-dark",
  );
  const [view, setView] = useState<ViewId>("models");
  const [route, setRoute] = useState<RouteState>(() => ({
    ...loadRoute(),
    routeApplying: false,
  }));
  const [proxy, setProxy] = useState<ProxyStatus | null>(null);
  const [gatewayCatalog, setGatewayCatalog] = useState<GatewayCatalogEntry[] | null>(null);
  const [gatewayHealth, setGatewayHealth] = useState<CloudHealth | null>(null);
  const [usageSnapshot, setUsageSnapshot] = useState<UsageSnapshot | null>(null);
  const [gatewayPort, setGatewayPortState] = useState(() => {
    const raw = parseInt(localStorage.getItem(STORAGE_PORT) || "", 10);
    return Number.isFinite(raw) && raw >= 1024 && raw <= 65535 ? raw : DEFAULT_PORT;
  });
  const [localMode, setLocalModeState] = useState(
    () =>
      new URLSearchParams(window.location.search).get("mode") === "local" ||
      localStorage.getItem(STORAGE_LOCAL_MODE) === "1",
  );
  const [cloudSession, setCloudSession] = useState<string | null>(null);
  const [cloudUser, setCloudUser] = useState<CloudUser | null>(() => loadStoredCloudUser());
  const [authReady, setAuthReady] = useState(false);
  const [catalogFetching, setCatalogFetching] = useState(false);
  const [roiBannerHidden, setRoiBannerHidden] = useState(
    () => localStorage.getItem(STORAGE_ROI) === "1",
  );
  const [connectBannerHidden, setConnectBannerHidden] = useState(
    () => localStorage.getItem(STORAGE_CONNECT_BANNER) === "1",
  );
  const [onboardDismissed, setOnboardDismissed] = useState(
    () => localStorage.getItem(STORAGE_ONBOARD) === "1",
  );
  const [firstChatDone, setFirstChatDone] = useState(
    () => localStorage.getItem(STORAGE_FIRST_CHAT) === "1",
  );
  const [viewSavingsDone, setViewSavingsDone] = useState(loadViewSavingsDone);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [modelSources, setModelSources] = useState<ModelSource[]>(() => loadModelSources());
  const [celebrateOpen, setCelebrateOpen] = useState(false);
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [addAppOpen, setAddAppOpen] = useState(false);
  const [sourceModalOpen, setSourceModalOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [workspace, setWorkspaceState] = useState(
    () => localStorage.getItem(STORAGE_WS) || WS_DEMO_PATHS[0],
  );
  const [agentEnabled, setAgentEnabledState] = useState(
    () => localStorage.getItem(STORAGE_AGENT) !== "0",
  );

  const gatewayBaseUrl = `http://127.0.0.1:${gatewayPort}/v1`;

  const cloudLoggedIn = Boolean(cloudSession);
  const needsCloudLogin = authReady && !cloudLoggedIn && !localMode;

  const signOutRef = useRef<() => Promise<void>>(async () => {});
  const gatewayCatalogRef = useRef(gatewayCatalog);
  gatewayCatalogRef.current = gatewayCatalog;

  useEffect(() => {
    let cancelled = false;
    const bootstrap = async () => {
      const token = await getCloudSession();
      const storedUser = loadStoredCloudUser();

      if (token) {
        if (!cancelled) {
          setCloudSession(token);
          if (storedUser) setCloudUser(storedUser);
        }
        if (proxy?.running) {
          const health = await fetchGatewayHealth(gatewayPort);
          if (cancelled) return;
          if (!health?.reachable) {
            /* Cloud sidecar still starting — keep keychain/file token */
          } else {
            const check = await validateCloudSessionViaProxy(gatewayBaseUrl, token);
            if (cancelled) return;
            if (check.kind === "ok") {
              setCloudUser(check.user);
              saveStoredCloudUser(check.user);
            } else if (check.kind === "invalid") {
              await signOutRef.current();
            }
          }
        }
      } else {
        if (storedUser) clearStoredCloudUser();
        if (!cancelled) {
          setCloudSession(null);
          setCloudUser(null);
        }
      }

      if (!cancelled) setAuthReady(true);
    };
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, [gatewayBaseUrl, proxy?.running]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
    localStorage.setItem(STORAGE_LANG, lang);
    localStorage.setItem(STORAGE_THEME, theme);
  }, [lang, theme]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const status = await invoke<ProxyStatus>("get_proxy_status");
        if (!cancelled) setProxy(status);
      } catch {
        if (!cancelled) setProxy(null);
      }
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [gatewayPort]);

  useEffect(() => {
    let cancelled = false;
    void invoke<{ proxy: { port: number } }>("get_settings")
      .then(async (settings) => {
        if (cancelled) return;
        const tauriPort = settings.proxy.port;
        const raw = localStorage.getItem(STORAGE_PORT);
        const stored = raw ? parseInt(raw, 10) : NaN;
        const port =
          Number.isFinite(stored) && stored >= 1024 && stored <= 65535 ? stored : tauriPort;
        if (port !== tauriPort) {
          try {
            const status = await invoke<ProxyStatus>("set_proxy_port", { port });
            if (!cancelled) {
              setGatewayPortState(port);
              setProxy(status);
            }
          } catch {
            if (!cancelled) {
              setGatewayPortState(tauriPort);
              localStorage.setItem(STORAGE_PORT, String(tauriPort));
            }
          }
        } else if (gatewayPort !== tauriPort) {
          setGatewayPortState(tauriPort);
          localStorage.setItem(STORAGE_PORT, String(tauriPort));
        }
      })
      .catch(() => {
        /* browser dev without tauri */
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!proxy?.running) {
      setGatewayCatalog(null);
      setGatewayHealth(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      if (!cancelled) setCatalogFetching(true);
      try {
        const health = await fetchGatewayHealth(gatewayPort);
        if (!cancelled) setGatewayHealth(health);

        const session = cloudSession ?? (await getCloudSession());
        if (session && !cloudSession) setCloudSession(session);

        const result = await fetchGatewayCatalog(gatewayBaseUrl, session);
        if (cancelled) return;
        if (result.ok) {
          setGatewayCatalog(result.data.length ? result.data : null);
        } else if (result.status === 401 && session && gatewayHealth?.reachable) {
          const check = await validateCloudSessionViaProxy(gatewayBaseUrl, session);
          if (check.kind === "invalid") void signOutRef.current();
        } else if (!gatewayCatalogRef.current) {
          setGatewayCatalog(null);
        }
      } catch {
        if (!cancelled) {
          setGatewayCatalog(null);
          setGatewayHealth(null);
        }
      } finally {
        if (!cancelled) setCatalogFetching(false);
      }
    };
    load();
    const id = window.setInterval(load, 60_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [gatewayBaseUrl, gatewayPort, proxy?.running, cloudSession]);

  useEffect(() => {
    if (!proxy?.running) return;
    if (gatewayHealth?.reachable) return;

    let cancelled = false;
    const boot = async () => {
      await ensureCloudDev();
      if (cancelled) return;
      const health = await fetchGatewayHealth(gatewayPort);
      if (!cancelled && health) setGatewayHealth(health);
    };
    void boot();
    const id = window.setInterval(() => {
      void boot();
    }, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [gatewayPort, proxy?.running, gatewayHealth?.reachable]);

  const gatewayLive = useMemo(
    () =>
      Boolean(
        gatewayHealth?.configured && cloudSession && isLiveGatewayCatalog(gatewayCatalog),
      ),
    [gatewayHealth, gatewayCatalog, cloudSession],
  );

  const catalogLoading = useMemo(() => {
    if (localMode || !cloudLoggedIn || !authReady) return false;
    if (gatewayLive) return false;
    return catalogFetching || Boolean(proxy?.running && gatewayHealth?.configured);
  }, [
    localMode,
    cloudLoggedIn,
    authReady,
    gatewayLive,
    catalogFetching,
    proxy?.running,
    gatewayHealth?.configured,
  ]);

  const cloudReachable = Boolean(gatewayHealth?.reachable ?? gatewayHealth?.configured);
  const cloudConfigured = Boolean(gatewayHealth?.configured);

  useEffect(() => {
    if (modelSources.length) {
      void syncModelSources(modelSources, modelSources[0]?.id ?? null);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- hydrate proxy sources once

  useEffect(() => {
    if (!proxy?.running) {
      setUsageSnapshot(null);
      return;
    }
    let cancelled = false;
    const load = async () => {
      try {
        const snap = await fetchUsageSnapshot(gatewayBaseUrl, cloudUser?.plan);
        if (!cancelled) setUsageSnapshot(snap);
      } catch {
        if (!cancelled) setUsageSnapshot(null);
      }
    };
    load();
    const id = window.setInterval(load, 10_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [gatewayBaseUrl, proxy?.running, cloudUser?.plan]);

  useEffect(() => {
    if (!proxy?.running) return;
    let cancelled = false;
    void fetchMemories(gatewayBaseUrl).then((rows) => {
      if (!cancelled) setMemories(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [gatewayBaseUrl, proxy?.running]);

  const cursorConnected = useMemo(
    () => isCursorConnected(usageSnapshot),
    [usageSnapshot],
  );

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

  useEffect(() => {
    if (!usageSnapshot) return;
    const profile = loadBonusProfileLocal();
    checkBudgetAlerts(usageSnapshot, profile.budget_alert !== false, lang, showToast);
  }, [usageSnapshot, lang, showToast]);

  const signOutWithCloud = useCallback(async () => {
    try {
      await clearCloudSession();
    } catch {
      /* keychain optional */
    }
    clearStoredCloudUser();
    setCloudSession(null);
    setCloudUser(null);
    setGatewayCatalog(null);
    showToast(t(lang, "toastLogout"));
    setView("models");
  }, [lang, showToast]);
  signOutRef.current = signOutWithCloud;

  const persistRoute = useCallback((next: RouteState) => {
    localStorage.setItem(
      STORAGE_ROUTE,
      JSON.stringify({
        smartRouteEnabled: next.smartRouteEnabled,
        activeGatewayModel: next.activeGatewayModel,
        activeIntent: next.activeIntent,
      }),
    );
  }, []);

  const applyRouteChanged = useCallback(
    (notify: boolean) => {
      const finish = (r: RouteState) => {
        persistRoute(r);
        return { ...r, routeApplying: false };
      };
      if (notify) {
        setRoute((r) => ({ ...r, routeApplying: true }));
        window.setTimeout(() => {
          setRoute((cur) => {
            const done = finish(cur);
            const appCount = countConnectedApps(usageSnapshot);
            const line = getRouteLineShort(lang, done, gatewayCatalog, cloudConfigured);
            showToast(
              appCount > 0
                ? t(lang, "toastRouteApplied")
                    .replace("{line}", line)
                    .replace("{n}", String(appCount))
                : t(lang, "toastRouteAppliedEmpty").replace("{line}", line),
            );
            return done;
          });
        }, 450);
      } else {
        setRoute((r) => finish(r));
      }
    },
    [lang, usageSnapshot, persistRoute, showToast, gatewayCatalog, cloudConfigured],
  );

  const selectIntent = useCallback(
    (id: string) => {
      setRoute((r) => {
        const intent = findProductIntent(id);
        let activeGatewayModel = r.activeGatewayModel;
        if (intent?.defaultModel && findCatalogModel(intent.defaultModel, gatewayCatalog, cloudConfigured)) {
          activeGatewayModel = intent.defaultModel;
        }
        return { ...r, activeIntent: id, activeGatewayModel };
      });
      applyRouteChanged(true);
    },
    [applyRouteChanged, gatewayCatalog, cloudConfigured],
  );

  const selectGatewayModel = useCallback(
    (id: string) => {
      setRoute((r) => {
        const m = findCatalogModel(id, gatewayCatalog, cloudConfigured);
        let activeIntent = r.activeIntent;
        const match = PRODUCT_INTENTS.find((i) => i.defaultModel === id);
        if (match) activeIntent = match.id;
        else if (m) {
          const byType = PRODUCT_INTENTS.find((i) => i.modelType === m.type);
          if (byType) activeIntent = byType.id;
        }
        return {
          ...r,
          smartRouteEnabled: false,
          activeGatewayModel: id,
          activeIntent,
        };
      });
      applyRouteChanged(true);
    },
    [applyRouteChanged, gatewayCatalog, cloudConfigured],
  );

  const toggleSmartRoute = useCallback(() => {
    setRoute((r) => {
      const smartRouteEnabled = !r.smartRouteEnabled;
      const profile = loadBonusProfileLocal();
      const nextProfile = { ...profile, smart_route: smartRouteEnabled };
      saveBonusProfileLocal(nextProfile);
      if (proxy?.running) {
        void syncBonusProfile(gatewayBaseUrl, nextProfile);
      }
      return { ...r, smartRouteEnabled };
    });
    applyRouteChanged(false);
  }, [applyRouteChanged, gatewayBaseUrl, proxy?.running]);

  const setTheme = useCallback((id: string) => {
    setThemeState(id);
  }, []);

  const setGatewayPort = useCallback(
    async (port: number) => {
      if (port < 1024 || port > 65535) {
        showToast(t(lang, "toastPortInvalid"));
        return;
      }
      localStorage.setItem(STORAGE_PORT, String(port));
      setGatewayPortState(port);
      try {
        const status = await invoke<ProxyStatus>("set_proxy_port", { port });
        setProxy(status);
        showToast(t(lang, "toastPortSaved"));
      } catch {
        showToast(t(lang, "toastPortInvalid"));
      }
    },
    [lang, showToast],
  );

  const tr = useCallback((key: I18nKey) => t(lang, key), [lang]);

  const enterLocalMode = useCallback(() => {
    localStorage.setItem(STORAGE_LOCAL_MODE, "1");
    setLocalModeState(true);
    void signOutRef.current();
    setView("settings");
    showToast(tr("modeLocalEntered"));
  }, [showToast, tr]);

  const exitLocalMode = useCallback(() => {
    localStorage.removeItem(STORAGE_LOCAL_MODE);
    setLocalModeState(false);
  }, []);

  const openAuth = useCallback((mode: AuthMode) => {
    sessionStorage.setItem("nodeai-auth-mode", mode);
    setView("auth");
  }, []);

  const openSignIn = useCallback(
    (mode: AuthMode = "login") => {
      exitLocalMode();
      openAuth(mode);
    },
    [exitLocalMode, openAuth],
  );

  const routeLine = useMemo(
    () => getRouteLineShort(lang, route, gatewayCatalog, cloudConfigured),
    [lang, route, gatewayCatalog, cloudConfigured],
  );
  const routeAppCount = useMemo(
    () => countConnectedApps(usageSnapshot),
    [usageSnapshot],
  );

  useEffect(() => {
    void syncNativeTrayMenu({
      lang,
      routeLine,
      routeApplying: route.routeApplying,
      cloudLoggedIn,
      localMode,
      usageSnapshot,
    });
  }, [
    lang,
    routeLine,
    route.routeApplying,
    cloudLoggedIn,
    localMode,
    usageSnapshot,
  ]);

  const markViewSavings = useCallback(() => {
    try {
      const done = JSON.parse(localStorage.getItem(STORAGE_VIEW_SAVINGS) || "{}") as Record<string, boolean>;
      done.viewSavings = true;
      localStorage.setItem(STORAGE_VIEW_SAVINGS, JSON.stringify(done));
    } catch {
      localStorage.setItem(STORAGE_VIEW_SAVINGS, JSON.stringify({ viewSavings: true }));
    }
    setViewSavingsDone(true);
  }, []);

  const rememberText = useCallback(
    async (text: string, tag: MemoryTag = "pref") => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const item = await createMemory(gatewayBaseUrl, trimmed, tag, lang);
      if (item) {
        setMemories((prev) => [item, ...prev]);
        showToast(t(lang, "toastRemembered"));
      } else {
        showToast(t(lang, "toastChatFailed"));
      }
    },
    [gatewayBaseUrl, lang, showToast],
  );

  const addMemoryManual = useCallback(
    async (text: string, tag: MemoryTag) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const item = await createMemory(gatewayBaseUrl, trimmed, tag, lang);
      if (item) {
        setMemories((prev) => [item, ...prev]);
        showToast(t(lang, "toastRemembered"));
      } else {
        showToast(t(lang, "toastChatFailed"));
      }
    },
    [gatewayBaseUrl, lang, showToast],
  );

  const addModelSource = useCallback((source: ModelSource) => {
    setModelSources((prev) => {
      const next = [source, ...prev.filter((s) => s.id !== source.id)];
      localStorage.setItem(STORAGE_SOURCES, JSON.stringify(next));
      void syncModelSources(next, next[0]?.id ?? null);
      return next;
    });
  }, []);

  const cycleWorkspace = useCallback(() => {
    setWorkspaceState((cur) => {
      const i = WS_DEMO_PATHS.indexOf(cur);
      const next = WS_DEMO_PATHS[(i + 1) % WS_DEMO_PATHS.length];
      localStorage.setItem(STORAGE_WS, next);
      showToast(t(lang, "toastWsChanged").replace("{p}", next));
      return next;
    });
  }, [lang, showToast]);

  const setWorkspace = useCallback((path: string) => {
    localStorage.setItem(STORAGE_WS, path);
    setWorkspaceState(path);
  }, []);

  const setAgentEnabled = useCallback((on: boolean) => {
    localStorage.setItem(STORAGE_AGENT, on ? "1" : "0");
    setAgentEnabledState(on);
  }, []);

  useEffect(() => {
    let cancelled = false;
    void invoke<string>("agent_default_workspace")
      .then((path) => {
        if (cancelled || !path) return;
        if (!localStorage.getItem(STORAGE_WS)) {
          setWorkspace(path);
        }
      })
      .catch(() => {
        /* browser dev without tauri */
      });
    return () => {
      cancelled = true;
    };
  }, [setWorkspace]);

  const closeAuth = useCallback(() => {
    setView("models");
  }, []);

  const signInWithCloud = useCallback(
    async (email: string, password: string) => {
      const cloudUp = await ensureCloudDev();
      if (!cloudUp) {
        showToast(t(lang, "toastCloudUnreachable"));
        return false;
      }
      const proxyUp = await waitForGatewayReady(gatewayPort);
      if (!proxyUp) {
        showToast(t(lang, "toastProxyUnreachable"));
        return false;
      }
      let result = await signInViaProxy(gatewayBaseUrl, email, password);
      if (!result.ok && isCloudConnectivityAuthError(result.error || "")) {
        const restarted = await ensureCloudDev(true);
        if (restarted) {
          result = await signInViaProxy(gatewayBaseUrl, email, password);
        }
      }
      if (!result.ok) {
        showToast(result.error || t(lang, "toastLoginFailed"));
        return false;
      }
      try {
        await saveCloudSession(result.data.token);
      } catch {
        showToast(t(lang, "toastKeychainFailed"));
        return false;
      }
      setCloudSession(result.data.token);
      setCloudUser(result.data.user);
      saveStoredCloudUser(result.data.user);
      localStorage.removeItem(STORAGE_LOCAL_MODE);
      setLocalModeState(false);
      showToast(t(lang, "toastLogin"));
      setView("models");
      return true;
    },
    [gatewayBaseUrl, gatewayPort, lang, showToast],
  );

  const signUpWithCloud = useCallback(
    async (email: string, password: string, name?: string) => {
      if (password.length < 6) {
        showToast(tr("authPasswordMin"));
        return false;
      }
      const cloudUp = await ensureCloudDev();
      if (!cloudUp) {
        showToast(t(lang, "toastCloudUnreachable"));
        return false;
      }
      const reg = await registerViaProxy(gatewayBaseUrl, email, password, name);
      if (!reg.ok) {
        showToast(reg.error || t(lang, "toastRegisterFailed"));
        return false;
      }
      return signInWithCloud(email, password);
    },
    [gatewayBaseUrl, lang, showToast, signInWithCloud, tr],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      ...route,
      lang,
      theme,
      view,
      proxy,
      gatewayPort,
      gatewayBaseUrl,
      gatewayCatalog,
      gatewayHealth,
      gatewayLive,
      cloudConfigured,
      cloudReachable,
      usageSnapshot,
      cursorConnected,
      localMode,
      enterLocalMode,
      exitLocalMode,
      openSignIn,
      cloudSession,
      cloudUser,
      cloudLoggedIn,
      authReady,
      needsCloudLogin,
      catalogLoading,
      roiBannerHidden,
      connectBannerHidden,
      onboardDismissed,
      firstChatDone,
      viewSavingsDone,
      memories,
      modelSources,
      celebrateOpen,
      catalogOpen,
      addAppOpen,
      sourceModalOpen,
      workspacePaths: WS_DEMO_PATHS,
      toast,
      workspace,
      agentEnabled,
      setView,
      toggleLang: () => setLang((l) => (l === "zh" ? "en" : "zh")),
      setTheme,
      toggleSmartRoute,
      selectIntent,
      selectGatewayModel,
      setGatewayPort,
      dismissRoiBanner: () => {
        localStorage.setItem(STORAGE_ROI, "1");
        setRoiBannerHidden(true);
      },
      dismissConnectBanner: () => {
        localStorage.setItem(STORAGE_CONNECT_BANNER, "1");
        setConnectBannerHidden(true);
      },
      dismissOnboard: () => {
        localStorage.setItem(STORAGE_ONBOARD, "1");
        setOnboardDismissed(true);
      },
      markFirstChatDone: () => {
        localStorage.setItem(STORAGE_FIRST_CHAT, "1");
        setFirstChatDone(true);
        localStorage.setItem(STORAGE_CONNECT_BANNER, "1");
        setConnectBannerHidden(true);
        setCelebrateOpen(true);
      },
      markViewSavings,
      rememberText,
      addMemoryManual,
      addModelSource,
      showCelebrate: () => setCelebrateOpen(true),
      hideCelebrate: () => setCelebrateOpen(false),
      setCatalogOpen,
      setAddAppOpen,
      setSourceModalOpen,
      cycleWorkspace,
      setWorkspace,
      setAgentEnabled,
      openAuth,
      closeAuth,
      signInWithCloud,
      signUpWithCloud,
      signOutWithCloud,
      showToast,
      tr,
      routeLine,
      routeApplying: route.routeApplying,
      routeAppCount,
    }),
    [
      route,
      lang,
      theme,
      view,
      proxy,
      gatewayPort,
      gatewayBaseUrl,
      gatewayCatalog,
      gatewayHealth,
      gatewayLive,
      cloudConfigured,
      cloudReachable,
      usageSnapshot,
      cursorConnected,
      localMode,
      enterLocalMode,
      exitLocalMode,
      openSignIn,
      cloudSession,
      cloudUser,
      cloudLoggedIn,
      authReady,
      needsCloudLogin,
      catalogLoading,
      roiBannerHidden,
      connectBannerHidden,
      onboardDismissed,
      firstChatDone,
      viewSavingsDone,
      memories,
      modelSources,
      celebrateOpen,
      catalogOpen,
      addAppOpen,
      sourceModalOpen,
      toast,
      workspace,
      agentEnabled,
      markViewSavings,
      rememberText,
      addMemoryManual,
      addModelSource,
      cycleWorkspace,
      setWorkspace,
      setAgentEnabled,
      openAuth,
      closeAuth,
      signInWithCloud,
      signUpWithCloud,
      signOutWithCloud,
      toggleSmartRoute,
      selectIntent,
      selectGatewayModel,
      setGatewayPort,
      showToast,
      tr,
      routeLine,
      routeAppCount,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used within AppProvider");
  return ctx;
}
