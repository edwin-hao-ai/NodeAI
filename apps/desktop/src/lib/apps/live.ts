import type { Lang } from "../../i18n";
import type { UsageSnapshot } from "../bonusApi";
import { KNOWN_APPS, slugFromAppKey, templateForUsageSlug, type AppTemplate } from "../product/apps";

export type AppConnectionStatus = "live" | "wait" | "new";

export interface LiveApp extends AppTemplate {
  status: AppConnectionStatus;
  requests: number;
  spendToday: number;
  share: number;
  tokensToday: number;
  lastSeenMs: number;
}

export function isBuiltinApp(app: AppTemplate): boolean {
  return app.id === "nodeai-chat" || Boolean(app.builtin);
}

export function isExternalApp(app: AppTemplate): boolean {
  return !isBuiltinApp(app);
}

export function appName(lang: Lang, app: AppTemplate): string {
  return app.name[lang];
}

function formatLastSeen(lang: Lang, ms: number): string {
  if (!ms) {
    return lang === "zh" ? "尚未收到请求" : "No requests yet";
  }
  const delta = Date.now() - ms;
  if (delta < 60_000) return lang === "zh" ? "刚刚在用" : "Active now";
  if (delta < 3_600_000) {
    const m = Math.floor(delta / 60_000);
    return lang === "zh" ? `${m} 分钟前` : `${m} min ago`;
  }
  const h = Math.floor(delta / 3_600_000);
  return lang === "zh" ? `${h} 小时前` : `${h} hr ago`;
}

export function lastSeenLabel(lang: Lang, app: LiveApp): string {
  if (app.id === "nodeai-chat" && app.requests > 0) {
    return lang === "zh" ? "本窗口" : "This window";
  }
  return formatLastSeen(lang, app.lastSeenMs);
}

export function liveAppsFromUsage(usage: UsageSnapshot | null): LiveApp[] {
  const todayStart = startOfLocalDayMs();
  const todayBySlug = spendBySlugSince(usage, todayStart);
  const totalToday = Object.values(todayBySlug).reduce((s, v) => s + v.spend, 0);

  return KNOWN_APPS.map((tpl) => {
    const usageSlug = slugFromAppKey(tpl.key) ?? tpl.id;
    const stats = usage?.app_stats?.[usageSlug] ?? usage?.app_stats?.[tpl.id];
    const today = todayBySlug[tpl.id];
    const requests = stats?.requests ?? usage?.apps?.[usageSlug] ?? usage?.apps?.[tpl.id] ?? 0;
    const spendToday = today?.spend ?? 0;
    const share = totalToday > 0 ? Math.round((spendToday / totalToday) * 100) : 0;
    const status: AppConnectionStatus = requests > 0 ? "live" : "wait";

    return {
      ...tpl,
      status,
      requests,
      spendToday,
      share,
      tokensToday: today?.tokens ?? 0,
      lastSeenMs: stats?.last_seen_ms ?? 0,
    };
  });
}

export function countConnectedApps(usage: UsageSnapshot | null): number {
  const live = liveAppsFromUsage(usage).filter((a) => a.status === "live");
  return live.length || 1;
}

export function isCursorConnected(usage: UsageSnapshot | null): boolean {
  const n = usage?.apps?.cursor ?? usage?.app_stats?.cursor?.requests ?? 0;
  return n > 0;
}

function startOfLocalDayMs(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function ledgerSlugToAppId(slug: string): string {
  return templateForUsageSlug(slug)?.id ?? slug;
}

function spendBySlugSince(
  usage: UsageSnapshot | null,
  sinceMs: number,
): Record<string, { spend: number; tokens: number; requests: number }> {
  const out: Record<string, { spend: number; tokens: number; requests: number }> = {};
  if (!usage?.ledger) return out;
  for (const row of usage.ledger) {
    if (row.ts_ms < sinceMs) continue;
    const appId = ledgerSlugToAppId(row.app_slug);
    if (!out[appId]) out[appId] = { spend: 0, tokens: 0, requests: 0 };
    out[appId].spend += row.cost_yuan;
    out[appId].tokens += row.prompt_tokens + row.completion_tokens;
    out[appId].requests += 1;
  }
  return out;
}

export function appForLedgerSlug(slug: string): AppTemplate {
  return templateForUsageSlug(slug) ?? {
    id: slug,
    icon: "apps",
    color: "var(--secondary)",
    key: `sk-nodeai-${slug}`,
    name: { zh: slug, en: slug },
  };
}

export function recentRouteLines(
  usage: UsageSnapshot | null,
  lang: Lang,
  limit = 6,
): { appId: string; icon: string; color: string; cost: string }[] {
  if (!usage?.ledger?.length) return [];
  return usage.ledger.slice(0, limit).map((row) => {
    const app = appForLedgerSlug(row.app_slug);
    const cost = lang === "zh" ? `¥${row.cost_yuan.toFixed(3)}` : `¥${row.cost_yuan.toFixed(3)}`;
    return { appId: app.id, icon: app.icon, color: app.color, cost };
  });
}

export function sparklineFromLedger(usage: UsageSnapshot | null, buckets = 40): number[] {
  const now = Date.now();
  const windowMs = 30 * 60_000;
  const bucketMs = windowMs / buckets;
  const counts = Array.from({ length: buckets }, () => 0);
  if (!usage?.ledger?.length) return counts;

  for (const row of usage.ledger) {
    if (row.ts_ms < now - windowMs) continue;
    const idx = Math.min(buckets - 1, Math.floor((now - row.ts_ms) / bucketMs));
    const rev = buckets - 1 - idx;
    counts[rev] += row.prompt_tokens + row.completion_tokens;
  }
  const max = Math.max(...counts, 1);
  return counts.map((c) => Math.round((c / max) * 40));
}

export function dailySpendBars(usage: UsageSnapshot | null): number[] {
  const bars = Array.from({ length: 7 }, () => 0);
  if (!usage?.ledger?.length) return bars;
  const now = new Date();
  for (const row of usage.ledger) {
    const d = new Date(row.ts_ms);
    const diffDays = Math.floor((now.getTime() - d.setHours(0, 0, 0, 0)) / 86_400_000);
    if (diffDays >= 0 && diffDays < 7) {
      bars[6 - diffDays] += row.cost_yuan;
    }
  }
  const max = Math.max(...bars, 0.01);
  return bars.map((v) => Math.round((v / max) * 32));
}
