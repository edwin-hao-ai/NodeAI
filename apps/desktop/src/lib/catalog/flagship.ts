/** Heuristic score — higher means more likely a latest flagship model. */
export function flagshipScore(id: string): number {
  const m = id.toLowerCase();
  let score = 0;

  for (const token of m.split(/[/:@._-]+/)) {
    if (token === "latest") score += 400;
    if (token === "opus") score += 520;
    if (token === "ultra") score += 480;
    if (token === "pro") score += 320;
    if (token === "max") score += 280;
    if (token === "plus") score += 200;
    if (token === "turbo") score += 160;
    if (token === "flash") score += 80;
    if (token === "mini" || token === "nano" || token === "lite") score -= 120;
    if (token === "preview") score -= 40;
    const num = Number(token.replace(/[^\d.]/g, ""));
    if (!Number.isNaN(num) && num > 0 && num < 1000) {
      score += num * 50;
    }
  }

  if (m.includes("gpt-4") && !m.includes("mini")) score += 100;
  if (m.includes("gpt-5")) score += 200;
  if (m.includes("claude-4") || m.includes("claude-sonnet-4")) score += 180;
  if (m.includes("gemini-2.5")) score += 150;
  if (m.includes("gemini-3")) score += 220;

  return score;
}

export function sortByFlagshipDesc<T extends { id: string }>(models: T[]): T[] {
  return models.slice().sort((a, b) => flagshipScore(b.id) - flagshipScore(a.id));
}
