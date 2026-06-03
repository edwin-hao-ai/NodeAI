import type { Lang } from "../i18n";
import { t } from "../i18n";
import type { UsageSnapshot } from "./bonusApi";

const STORAGE_LOW = "nodeai-budget-alert-low";
const STORAGE_SPIKE = "nodeai-budget-alert-spike";

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function checkBudgetAlerts(
  snapshot: UsageSnapshot | null,
  enabled: boolean,
  lang: Lang,
  showToast: (msg: string) => void,
): void {
  if (!enabled || !snapshot?.budget) return;

  const cap = snapshot.budget.cap_yuan;
  const used = snapshot.budget.used_yuan ?? 0;
  if (cap > 0) {
    const ratio = used / cap;
    if (ratio >= 0.85) {
      const day = todayKey();
      if (localStorage.getItem(STORAGE_LOW) !== day) {
        localStorage.setItem(STORAGE_LOW, day);
        const pct = Math.round(ratio * 100);
        showToast(t(lang, "budgetAlertLow").replace("{pct}", String(pct)));
      }
    }
  }

  const stats = snapshot.app_stats;
  if (!stats || Object.keys(stats).length < 2) return;

  const todaySpend = snapshot.periods?.today?.spend_yuan ?? 0;
  if (todaySpend < 0.5) return;

  let topSlug = "";
  let topSpend = 0;
  for (const [slug, row] of Object.entries(stats)) {
    if (slug === "chat") continue;
    if (row.spend_yuan > topSpend) {
      topSpend = row.spend_yuan;
      topSlug = slug;
    }
  }
  if (!topSlug || topSpend < todaySpend * 0.55) return;

  const spikeDay = `${todayKey()}:${topSlug}`;
  if (localStorage.getItem(STORAGE_SPIKE) === spikeDay) return;
  localStorage.setItem(STORAGE_SPIKE, spikeDay);
  const label = topSlug.charAt(0).toUpperCase() + topSlug.slice(1);
  showToast(t(lang, "budgetAlertAppSpike").replace("{app}", label));
}
