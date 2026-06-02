export interface GatewayModel {
  id: string;
  type: "lang" | "image" | "video" | "embed";
  provider: string;
  priceIn: number;
  priceOut: number;
  ctx?: number;
  speed?: "fast" | "balanced" | "deep" | string;
  caps?: readonly string[];
  priceUnit?: "image" | "video" | string;
  displayName: { zh: string; en: string };
  /** priceIn/priceOut are USD per 1M tokens when source is gateway. */
  priceSource?: "gateway" | "demo";
}
