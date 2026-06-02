import type { GatewayCatalogEntry } from "../gateway/types";
import { gatewayEntryToModel } from "../gateway/normalize";
import { demoModelById, demoModelPool } from "./demo";
import type { GatewayModel } from "./types";

export function catalogModelPool(gateway: GatewayCatalogEntry[] | null): GatewayModel[] {
  if (!gateway?.length) return demoModelPool();
  return gateway.map(gatewayEntryToModel);
}

export function findCatalogModel(
  id: string,
  gateway: GatewayCatalogEntry[] | null,
): GatewayModel | undefined {
  return catalogModelPool(gateway).find((m) => m.id === id) ?? demoModelById(id);
}
