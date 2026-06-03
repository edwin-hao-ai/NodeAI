import { invoke } from "@tauri-apps/api/core";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect } from "react";
import { TrayHudPanel } from "./components/TrayHudPanel";
import { AppProvider } from "./state/AppContext";
import type { ViewId } from "./state/AppContext";
import "./styles/app.css";

function TrayHudShell() {
  useEffect(() => {
    document.documentElement.classList.add("tray-hud-html");
    const root = document.getElementById("root");
    root?.classList.add("tray-hud-root");

    const win = getCurrentWebviewWindow();
    let unlisten: (() => void) | undefined;
    void win.onFocusChanged(({ payload: focused }) => {
      if (!focused) void win.hide();
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      document.documentElement.classList.remove("tray-hud-html");
      root?.classList.remove("tray-hud-root");
      unlisten?.();
    };
  }, []);

  const openView = (view: ViewId) => {
    void invoke("open_main_view", { view });
  };

  return (
    <div className="tray-hud-shell">
      <TrayHudPanel variant="window" onNavigate={openView} />
    </div>
  );
}

export default function TrayHudApp() {
  return (
    <AppProvider>
      <TrayHudShell />
    </AppProvider>
  );
}
