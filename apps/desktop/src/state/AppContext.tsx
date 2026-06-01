import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { invoke } from "@tauri-apps/api/core";
import { DEMO } from "../data/demo";
import {
  countRouteApps,
  gatewayModelById,
  getRouteLineShort,
  type RouteState,
} from "../lib/route";
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
  | "settings";

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
  cursorConnected: boolean;
  localMode: boolean;
  roiBannerHidden: boolean;
  connectBannerHidden: boolean;
  onboardDismissed: boolean;
  firstChatDone: boolean;
  toast: string | null;
  workspace: string;
  setView: (view: ViewId) => void;
  toggleLang: () => void;
  setTheme: (theme: string) => void;
  toggleSmartRoute: () => void;
  selectIntent: (id: string) => void;
  selectGatewayModel: (id: string) => void;
  setGatewayPort: (port: number) => void;
  setCursorConnected: (v: boolean) => void;
  dismissRoiBanner: () => void;
  dismissConnectBanner: () => void;
  dismissOnboard: () => void;
  markFirstChatDone: () => void;
  showToast: (msg: string) => void;
  tr: (key: I18nKey) => string;
  routeLine: string;
  routeAppCount: number;
}

const AppContext = createContext<AppContextValue | null>(null);

const STORAGE_LANG = "nodeai-lang";
const STORAGE_THEME = "nodeai-theme";
const STORAGE_ROUTE = "nodeai-route";
const STORAGE_PORT = "nodeai-gateway-port";
const STORAGE_CURSOR = "nodeai-cursor-connected";
const STORAGE_ROI = "nodeai-roi-hidden";
const STORAGE_CONNECT_BANNER = "nodeai-connect-banner-hidden";
const STORAGE_ONBOARD = "nodeai-onboard-dismissed";
const STORAGE_FIRST_CHAT = "nodeai-first-chat-done";
const STORAGE_WS = "nodeai-workspace";
const DEFAULT_PORT = 8787;

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
  const [gatewayPort, setGatewayPortState] = useState(() => {
    const raw = parseInt(localStorage.getItem(STORAGE_PORT) || "", 10);
    return Number.isFinite(raw) && raw >= 1024 && raw <= 65535 ? raw : DEFAULT_PORT;
  });
  const [cursorConnected, setCursorConnected] = useState(
    () => localStorage.getItem(STORAGE_CURSOR) === "1",
  );
  const [localMode] = useState(
    () => new URLSearchParams(window.location.search).get("mode") === "local",
  );
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
  const [toast, setToast] = useState<string | null>(null);
  const [workspace] = useState(
    () => localStorage.getItem(STORAGE_WS) || "~/Documents/NodeAI",
  );

  const gatewayBaseUrl = `http://127.0.0.1:${gatewayPort}/v1`;

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

  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }, []);

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
            showToast(
              t(lang, "toastRouteApplied")
                .replace("{line}", getRouteLineShort(lang, done))
                .replace("{n}", String(countRouteApps(cursorConnected))),
            );
            return done;
          });
        }, 450);
      } else {
        setRoute((r) => finish(r));
      }
    },
    [lang, cursorConnected, persistRoute, showToast],
  );

  const selectIntent = useCallback(
    (id: string) => {
      setRoute((r) => {
        const intent = DEMO.INTENTS.find((i) => i.id === id);
        let activeGatewayModel = r.activeGatewayModel;
        if (intent?.defaultModel && gatewayModelById(intent.defaultModel)) {
          activeGatewayModel = intent.defaultModel;
        }
        return { ...r, activeIntent: id, activeGatewayModel };
      });
      applyRouteChanged(true);
    },
    [applyRouteChanged],
  );

  const selectGatewayModel = useCallback(
    (id: string) => {
      setRoute((r) => {
        const m = gatewayModelById(id);
        let activeIntent = r.activeIntent;
        const match = DEMO.INTENTS.find((i) => i.defaultModel === id);
        if (match) activeIntent = match.id;
        else if (m) {
          const byType = DEMO.INTENTS.find((i) => i.modelType === m.type);
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
    [applyRouteChanged],
  );

  const toggleSmartRoute = useCallback(() => {
    setRoute((r) => ({ ...r, smartRouteEnabled: !r.smartRouteEnabled }));
    applyRouteChanged(false);
  }, [applyRouteChanged]);

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

  const routeLine = useMemo(() => getRouteLineShort(lang, route), [lang, route]);
  const routeAppCount = useMemo(() => countRouteApps(cursorConnected), [cursorConnected]);

  const value = useMemo<AppContextValue>(
    () => ({
      ...route,
      lang,
      theme,
      view,
      proxy,
      gatewayPort,
      gatewayBaseUrl,
      cursorConnected,
      localMode,
      roiBannerHidden,
      connectBannerHidden,
      onboardDismissed,
      firstChatDone,
      toast,
      workspace,
      setView,
      toggleLang: () => setLang((l) => (l === "zh" ? "en" : "zh")),
      setTheme,
      toggleSmartRoute,
      selectIntent,
      selectGatewayModel,
      setGatewayPort,
      setCursorConnected: (v: boolean) => {
        localStorage.setItem(STORAGE_CURSOR, v ? "1" : "0");
        setCursorConnected(v);
      },
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
      },
      showToast,
      tr,
      routeLine,
      routeAppCount,
    }),
    [
      route,
      lang,
      theme,
      view,
      proxy,
      gatewayPort,
      cursorConnected,
      localMode,
      roiBannerHidden,
      connectBannerHidden,
      onboardDismissed,
      firstChatDone,
      toast,
      workspace,
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
