import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import TrayHudApp from "./TrayHudApp";
import { isTauriShell } from "./lib/platform";

async function bootstrap() {
  const rootEl = document.getElementById("root") as HTMLElement;
  let isHud = false;
  if (isTauriShell()) {
    try {
      const { getCurrentWebviewWindow } = await import("@tauri-apps/api/webviewWindow");
      isHud = getCurrentWebviewWindow().label === "tray-hud";
    } catch {
      /* web preview */
    }
  }

  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>{isHud ? <TrayHudApp /> : <App />}</React.StrictMode>,
  );
}

void bootstrap();
