import type { LedgerEntry, PeriodStats } from "../bonusApi";

export type BillPeriod = "today" | "week" | "month";
export type BillPath = "all" | "hosted" | "byok";

export interface BillingAggregate {
  spend: number;
  saved: number;
  tokens: number;
  reqs: number;
  saveCompress: number;
  saveConcise: number;
  saveRoute: number;
  savePrune: number;
  models: { id: string; pct: number; amount: number; tokens: number; reqs: number }[];
}

export function periodStartMs(period: BillPeriod): number {
  const now = Date.now();
  if (period === "today") {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  if (period === "week") return now - 7 * 86_400_000;
  return now - 30 * 86_400_000;
}

function matchesPath(path: BillPath, rowPath: string): boolean {
  if (path === "all") return true;
  if (path === "hosted") return rowPath === "hosted";
  return rowPath === "byok";
}

function fromPeriodStats(stats: PeriodStats): BillingAggregate {
  const models = stats.by_model.map((m) => ({
    id: m.model,
    pct: stats.spend_yuan > 0 ? Math.round((m.amount_yuan / stats.spend_yuan) * 100) : 0,
    amount: m.amount_yuan,
    tokens: m.tokens,
    reqs: m.requests,
  }));
  return {
    spend: stats.spend_yuan,
    saved: stats.saved_yuan,
    tokens: stats.tokens,
    reqs: stats.requests,
    saveCompress: stats.save_compress_yuan,
    saveConcise: stats.save_concise_yuan,
    saveRoute: stats.save_route_yuan,
    savePrune: stats.save_prune_yuan,
    models,
  };
}

function emptyAggregate(): BillingAggregate {
  return {
    spend: 0,
    saved: 0,
    tokens: 0,
    reqs: 0,
    saveCompress: 0,
    saveConcise: 0,
    saveRoute: 0,
    savePrune: 0,
    models: [],
  };
}

export function aggregateBilling(
  period: BillPeriod,
  path: BillPath,
  periodStats: PeriodStats,
  ledger: LedgerEntry[] | undefined,
): BillingAggregate {
  if (path === "all") {
    return fromPeriodStats(periodStats);
  }

  const since = periodStartMs(period);
  const rows = (ledger ?? []).filter((r) => r.ts_ms >= since && matchesPath(path, r.path));
  if (rows.length === 0) {
    return emptyAggregate();
  }

  let spend = 0;
  let tokens = 0;
  const byModel = new Map<string, { amount: number; tokens: number; reqs: number }>();

  for (const row of rows) {
    spend += row.cost_yuan;
    const rowTokens = row.prompt_tokens + row.completion_tokens;
    tokens += rowTokens;
    const cur = byModel.get(row.model) ?? { amount: 0, tokens: 0, reqs: 0 };
    cur.amount += row.cost_yuan;
    cur.tokens += rowTokens;
    cur.reqs += 1;
    byModel.set(row.model, cur);
  }

  const models = [...byModel.entries()]
    .map(([id, m]) => ({
      id,
      pct: spend > 0 ? Math.round((m.amount / spend) * 100) : 0,
      amount: m.amount,
      tokens: m.tokens,
      reqs: m.reqs,
    }))
    .sort((a, b) => b.amount - a.amount);

  const totalSpend = Math.max(periodStats.spend_yuan, 0.000_001);
  const ratio = Math.min(spend / totalSpend, 1);

  return {
    spend,
    saved: periodStats.saved_yuan * ratio,
    tokens,
    reqs: rows.length,
    saveCompress: periodStats.save_compress_yuan * ratio,
    saveConcise: periodStats.save_concise_yuan * ratio,
    saveRoute: periodStats.save_route_yuan * ratio,
    savePrune: periodStats.save_prune_yuan * ratio,
    models,
  };
}

export function estimateBudgetDaysLeft(remainYuan: number, dailySpend: number, lang: "zh" | "en"): string {
  if (remainYuan <= 0) return lang === "zh" ? "额度已用尽" : "Allowance used up";
  if (dailySpend <= 0) return lang === "zh" ? "暂无用量" : "No usage yet";
  const days = Math.max(1, Math.round(remainYuan / dailySpend));
  return lang === "zh" ? `约 ${days} 天` : `~${days} days`;
}
