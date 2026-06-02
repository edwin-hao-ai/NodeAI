import type { GatewayCatalogEntry } from "../gateway/types";
import { gatewayEntryToModel, isLiveGatewayCatalog } from "../gateway";
import { defaultVirtualCatalog } from "./virtual";
import type { GatewayModel } from "./types";

export function catalogModelPool(
  gateway: GatewayCatalogEntry[] | null,
  cloudConfigured = false,
): GatewayModel[] {
  if (gateway?.length) {
    return gateway.map(gatewayEntryToModel);
  }
  if (cloudConfigured) {
    return [];
  }
  return defaultVirtualCatalog().map(gatewayEntryToModel);
}

export function isGatewayRegistryLive(gateway: GatewayCatalogEntry[] | null): boolean {
  return isLiveGatewayCatalog(gateway);
}

export function findCatalogModel(
  id: string,
  gateway: GatewayCatalogEntry[] | null,
  cloudConfigured = false,
): GatewayModel | undefined {
  return catalogModelPool(gateway, cloudConfigured).find((m) => m.id === id);
}
