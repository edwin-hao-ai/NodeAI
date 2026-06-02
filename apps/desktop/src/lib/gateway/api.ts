import type { GatewayCatalogEntry } from "./types";

export async function fetchGatewayCatalog(baseUrl: string): Promise<GatewayCatalogEntry[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/models`;
  const resp = await fetch(url);
  if (!resp.ok) return [];
  const data = (await resp.json()) as { data?: GatewayCatalogEntry[] };
  return data.data ?? [];
}
