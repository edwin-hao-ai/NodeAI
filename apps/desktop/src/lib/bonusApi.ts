export interface CompressionProfile {
  rtk: boolean;
  caveman_level: number;
  prune: boolean;
  memory_inject: boolean;
  smart_route: boolean;
  failover: boolean;
}

export interface BonusTotals {
  rtk_requests: number;
  rtk_tokens_saved: number;
  caveman_requests: number;
  memory_injections: number;
  save_compress_yuan: number;
  save_concise_yuan: number;
}

export interface LedgerEntry {
  ts_ms: number;
  app_slug: string;
  model: string;
  path: string;
  prompt_tokens: number;
  completion_tokens: number;
  cost_yuan: number;
}

export interface AppStats {
  requests: number;
  prompt_tokens: number;
  completion_tokens: number;
  spend_yuan: number;
  last_seen_ms: number;
}

export interface ModelSpend {
  model: string;
  amount_yuan: number;
  tokens: number;
  requests: number;
}

export interface PeriodStats {
  spend_yuan: number;
  saved_yuan: number;
  tokens: number;
  requests: number;
  save_compress_yuan: number;
  save_concise_yuan: number;
  save_route_yuan: number;
  by_model: ModelSpend[];
}

export interface PeriodBundle {
  today: PeriodStats;
  week: PeriodStats;
  month: PeriodStats;
}

export interface BudgetSnapshot {
  cap_yuan: number;
  used_yuan: number;
  plan: string;
}

export interface UsageSnapshot {
  apps: Record<string, number>;
  app_stats?: Record<string, AppStats>;
  bonus: BonusTotals;
  ledger?: LedgerEntry[];
  periods?: PeriodBundle;
  budget?: BudgetSnapshot;
}

export const DEFAULT_BONUS_PROFILE: CompressionProfile = {
  rtk: true,
  caveman_level: 1,
  prune: false,
  memory_inject: true,
  smart_route: true,
  failover: true,
};

const STORAGE_BONUS = "nodeai-bonus-profile";

export function loadBonusProfileLocal(): CompressionProfile {
  try {
    const raw = localStorage.getItem(STORAGE_BONUS);
    if (raw) return { ...DEFAULT_BONUS_PROFILE, ...JSON.parse(raw) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT_BONUS_PROFILE };
}

export function saveBonusProfileLocal(profile: CompressionProfile) {
  localStorage.setItem(STORAGE_BONUS, JSON.stringify(profile));
}

export async function fetchBonusProfile(baseUrl: string): Promise<CompressionProfile | null> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/nodeai/bonus`);
    if (!resp.ok) return null;
    return (await resp.json()) as CompressionProfile;
  } catch {
    return null;
  }
}

export async function syncBonusProfile(baseUrl: string, profile: CompressionProfile): Promise<boolean> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/nodeai/bonus`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    return resp.ok;
  } catch {
    return false;
  }
}

export async function fetchUsageSnapshot(
  baseUrl: string,
  plan?: string,
): Promise<UsageSnapshot | null> {
  try {
    const headers: Record<string, string> = {};
    if (plan) headers["X-NodeAI-Plan"] = plan;
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/nodeai/usage`, { headers });
    if (!resp.ok) return null;
    return (await resp.json()) as UsageSnapshot;
  } catch {
    return null;
  }
}

export function parseBonusHeader(header: string | null): {
  rtk: boolean;
  saved: number;
  caveman: boolean;
  memory: boolean;
} | null {
  if (!header) return null;
  const parts = Object.fromEntries(
    header.split(";").map((p) => {
      const [k, v] = p.split("=");
      return [k.trim(), v?.trim() ?? ""];
    }),
  );
  return {
    rtk: parts.rtk === "1",
    saved: Number(parts.saved) || 0,
    caveman: parts.caveman === "1",
    memory: parts.memory === "1",
  };
}

export function emptyPeriodStats(): PeriodStats {
  return {
    spend_yuan: 0,
    saved_yuan: 0,
    tokens: 0,
    requests: 0,
    save_compress_yuan: 0,
    save_concise_yuan: 0,
    save_route_yuan: 0,
    by_model: [],
  };
}
