export interface GatewayModelPricing {
  input?: string;
  output?: string;
  image?: string;
  video?: string;
  input_cache_read?: string;
}

export interface GatewayCatalogEntry {
  id: string;
  object?: string;
  owned_by: string;
  name?: string;
  description?: string;
  context_window?: number;
  type?: string;
  tags?: string[];
  pricing?: GatewayModelPricing;
}
