import { useMemo } from "react";
import { fmtMoney, fmtTokens, sparkPath } from "../lib/format";
import { appForLedgerSlug, sparklineFromLedger } from "../lib/route";
import { useApp } from "../state/AppContext";
import type { ViewId } from "../state/AppContext";

type TrayAppRow = {
  id: string;
  color: string;
  label: { zh: string; en: string };
  count: number;
};

function toTrayRow(slug: string, count: number): TrayAppRow {
  const app = appForLedgerSlug(slug);
  return { id: app.id, color: app.color, label: app.name, count };
}

type TrayHudPanelProps = {
  /** Anchored popover inside main window menubar */
  variant?: "popover" | "window";
  open?: boolean;
  onNavigate: (view: ViewId) => void;
};

export function TrayHudPanel({ variant = "popover", open = true, onNavigate }: TrayHudPanelProps) {
  const {
    lang,
    tr,
    routeLine,
    routeApplying,
    usageSnapshot,
    cloudLoggedIn,
    localMode,
  } = useApp();

  const traySignedIn = cloudLoggedIn || localMode;
  const cap = traySignedIn ? usageSnapshot?.budget?.cap_yuan : undefined;
  const used = usageSnapshot?.budget?.used_yuan ?? 0;
  const remain = cap != null ? Math.max(cap - used, 0) : null;
  const liveSaved = traySignedIn ? (usageSnapshot?.periods?.today?.saved_yuan ?? 0) : 0;
  const today = usageSnapshot?.periods?.today;
  const todayTokens = today?.tokens ?? 0;
  const spark = useMemo(() => sparklineFromLedger(usageSnapshot, 16), [usageSnapshot]);
  const sparkD = sparkPath(spark, 64, 24);

  const trayApps = useMemo((): TrayAppRow[] => {
    if (!usageSnapshot?.apps || Object.keys(usageSnapshot.apps).length === 0) {
      return [];
    }
    return Object.entries(usageSnapshot.apps)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([slug, count]) => toTrayRow(slug, count));
  }, [usageSnapshot]);

  const className =
    variant === "window"
      ? "tray-hud-panel tray-hud-panel--window"
      : `tray-popover${open ? " open" : ""}`;

  return (
    <div
      className={className}
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
      role="dialog"
      aria-label={tr("tipTray")}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10, fontSize: 13, fontWeight: 500 }}>
        <span className="live-dot" style={{ width: 8, height: 8 }} />
        <span>
          {!traySignedIn
            ? tr("trayNotLoggedIn")
            : localMode && !cloudLoggedIn
              ? tr("trayLocalMode")
              : tr("trayRunning")}
        </span>
      </div>
      <div className="tray-route">
        {routeApplying ? (
          tr("routeApplying")
        ) : (
          <>
            {tr("trayRouteLbl")}
            <strong>{routeLine}</strong>
          </>
        )}
      </div>
      <div className="hud-pop-row">
        <span className="hud-pop-lbl">{tr("tokenFlow")}</span>
        <span className="mono">{fmtTokens(todayTokens)}</span>
      </div>
      <div className="hud-pop-row">
        <span className="hud-pop-lbl">{tr("budgetLeft")}</span>
        <span className="mono">{remain != null ? fmtMoney(remain, lang) : "—"}</span>
      </div>
      <div className="hud-pop-row">
        <span className="hud-pop-lbl">{tr("savedToday")}</span>
        <span className="mono savings-text">{fmtMoney(liveSaved, lang)}</span>
      </div>
      <div className="tray-spark-wrap">
        <svg viewBox="0 0 64 24" aria-hidden>
          <path d={sparkD} className="hud-spark-path" fill="none" />
        </svg>
      </div>
      <div className="tray-apps-mini">
        {trayApps.length > 0 ? (
          trayApps.map((a) => (
            <span
              key={a.id}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 4,
                marginRight: 8,
                color: "var(--on-surface-variant)",
              }}
            >
              <span className="app-dot" style={{ background: a.color }} />
              {a.label[lang]}
              <span className="mono" style={{ color: "var(--primary)" }}>
                {a.count}
              </span>
            </span>
          ))
        ) : (
          <span style={{ color: "var(--on-surface-variant)" }}>{tr("trayNoApps")}</span>
        )}
      </div>
      <div className="hud-pop-actions">
        <button type="button" onClick={() => onNavigate("hub")}>
          {tr("navHub")}
        </button>
        <button type="button" onClick={() => onNavigate("chat")}>
          {tr("navChat")}
        </button>
        <button type="button" onClick={() => onNavigate("billing")}>
          {tr("navBilling")}
        </button>
      </div>
    </div>
  );
}
