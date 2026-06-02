import type { GatewayCatalogEntry } from "./types";

export interface CloudHealth {
  configured: boolean;
  models: number;
  /** True when NODEAI_CLOUD_BASE_URL points at localhost dev API. */
  dev_local?: boolean;
}

/** @deprecated use CloudHealth — kept for gradual UI rename */
export type GatewayHealth = CloudHealth;

export async function fetchGatewayHealth(proxyPort: number): Promise<CloudHealth | null> {
  try {
    const resp = await fetch(`http://127.0.0.1:${proxyPort}/health`);
    if (!resp.ok) return null;
    const data = (await resp.json()) as {
      cloud?: CloudHealth & { dev_local?: boolean };
      gateway?: CloudHealth;
    };
    const cloud = data.cloud ?? data.gateway;
    if (!cloud) return null;
    return {
      configured: cloud.configured,
      models: cloud.models,
      dev_local: data.cloud?.dev_local,
    };
  } catch {
    return null;
  }
}

export async function fetchGatewayCatalog(
  baseUrl: string,
  cloudSession?: string | null,
): Promise<GatewayCatalogEntry[] | null> {
  const url = `${baseUrl.replace(/\/$/, "")}/models`;
  const headers: Record<string, string> = {};
  if (cloudSession) {
    headers["X-NodeAI-Cloud-Token"] = cloudSession;
  }
  try {
    const resp = await fetch(url, { headers });
    if (resp.status === 401) return null;
    if (!resp.ok) return null;
    const data = (await resp.json()) as { data?: GatewayCatalogEntry[] };
    return data.data ?? null;
  } catch {
    return null;
  }
}

/** True when catalog looks like live Cloud registry (provider/model slugs), not offline nodeai-* stubs. */
export function isLiveGatewayCatalog(catalog: GatewayCatalogEntry[] | null): boolean {
  if (!catalog?.length) return false;
  if (catalog.length < 20) return false;
  return catalog.some((m) => m.id.includes('/') && !m.id.startsWith("nodeai-"));
}
