import { DEMO } from "../../data/demo";
import type { GatewayModel } from "./types";

/** Offline fallback when Gateway catalog is unavailable. */
export function demoModelById(id: string): GatewayModel | undefined {
  const m = DEMO.GATEWAY_MODELS.find((x) => x.id === id);
  return m ? ({ ...m, priceSource: "demo" } as GatewayModel) : undefined;
}

export function demoModelPool(): GatewayModel[] {
  return DEMO.GATEWAY_MODELS.map((m) => ({ ...m, priceSource: "demo" as const }));
}
