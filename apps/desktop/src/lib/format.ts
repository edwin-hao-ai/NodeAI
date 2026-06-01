import type { Lang } from "../i18n";
import { DEMO } from "../data/demo";

export function fmtMoney(n: number, lang: Lang = "zh"): string {
  return lang === "zh" ? `¥${n.toFixed(2)}` : `¥${n.toFixed(2)}`;
}

export function budgetRemain(): number {
  return DEMO.BUDGET.cap - DEMO.BUDGET.used;
}

export function fmtTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}K`;
  return String(n);
}

export function fmtRate(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K/s`;
  return `${Math.round(n)}/s`;
}

export function sparkPath(values: number[], w = 260, h = 40): string {
  const max = Math.max(...values, 1);
  const pts = values.map((v, i) => {
    const x = (i / (values.length - 1)) * w;
    const y = h - (v / max) * (h - 4) - 2;
    return `${x},${y}`;
  });
  return `M ${pts.join(" L ")}`;
}

export function sparkAreaPath(values: number[], w = 260, h = 40): string {
  const line = sparkPath(values, w, h);
  return `${line} L ${w},${h} L 0,${h} Z`;
}
