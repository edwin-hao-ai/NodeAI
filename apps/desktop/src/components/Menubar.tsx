import { listen } from "@tauri-apps/api/event";
import { useEffect, useState } from "react";
import { BrandMark } from "./BrandMark";
import { TrayHudPanel } from "./TrayHudPanel";
import { fmtMoney, fmtTokens } from "../lib/format";
import { isTauriShell } from "../lib/platform";
import { useApp } from "../state/AppContext";
import type { ViewId } from "../state/AppContext";

export function Menubar({ nativeShell = false }: { nativeShell?: boolean }) {
  const {
    lang,
    toggleLang,
    tr,
    setView,
    usageSnapshot,
    cloudLoggedIn,
    localMode,
  } = useApp();
  const [trayOpen, setTrayOpen] = useState(false);
  const traySignedIn = cloudLoggedIn || localMode;
  const today = usageSnapshot?.periods?.today;
  const todayTokens = today?.tokens ?? 0;
  const liveSaved = traySignedIn ? (usageSnapshot?.periods?.today?.saved_yuan ?? 0) : 0;

  const rateLabel = !traySignedIn
    ? tr("trayNotLoggedIn")
    : todayTokens > 0
      ? tr("trayHudTokens").replace("{n}", fmtTokens(todayTokens))
      : liveSaved > 0
        ? tr("trayHudSaved").replace("{v}", fmtMoney(liveSaved, lang))
        : tr("trayRunningShort");

  useEffect(() => {
    if (!isTauriShell()) return;
    const unsubs: Array<() => void> = [];
    void listen<string>("tray-navigate", (e) => {
      setTrayOpen(false);
      const v = e.payload as ViewId;
      if (v === "hub" || v === "chat" || v === "billing") setView(v);
    }).then((u) => unsubs.push(u));
    return () => {
      unsubs.forEach((f) => f());
    };
  }, [setView]);

  useEffect(() => {
    if (!trayOpen) return;
    const close = () => setTrayOpen(false);
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [trayOpen]);

  const navigateFromMenubar = (view: ViewId) => {
    setTrayOpen(false);
    setView(view);
  };

  return (
    <header className={`menubar${nativeShell ? " menubar-native" : ""}`}>
      <div
        className={nativeShell ? "menubar-drag" : undefined}
        style={{ display: "flex", alignItems: "center", gap: 6, fontWeight: 500, flex: 1, minWidth: 0 }}
        {...(nativeShell ? { "data-tauri-drag-region": true } : {})}
      >
        <BrandMark size={15} />
        NodeAI
      </div>
      <div className="menubar-right menubar-tray-anchor">
        <button className="lang-btn" type="button" onClick={toggleLang}>
          {lang === "zh" ? "EN" : "中文"}
        </button>
        <button
          className="tray-trigger"
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setTrayOpen((o) => !o);
          }}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16, color: "var(--savings)" }}>
            shield
          </span>
          <span className="mono">{rateLabel}</span>
        </button>
        <TrayHudPanel open={trayOpen} onNavigate={navigateFromMenubar} />
      </div>
    </header>
  );
}
