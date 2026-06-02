import type { Lang } from "../../i18n";
import type { GatewayModel } from "./types";

export function fmtModelPrice(lang: Lang, m: GatewayModel): string {
  const isGateway = m.priceSource === "gateway";
  const sym = isGateway ? "$" : "¥";

  if (m.priceUnit === "image") {
    return lang === "zh" ? `${sym}${m.priceOut.toFixed(3)}/张` : `${sym}${m.priceOut.toFixed(3)}/img`;
  }
  if (m.priceUnit === "video") {
    return lang === "zh" ? `${sym}${m.priceOut.toFixed(2)}/条` : `${sym}${m.priceOut.toFixed(2)}/clip`;
  }
  if (m.type === "embed") {
    if (m.priceIn <= 0 && m.priceOut <= 0) return "—";
    return lang === "zh" ? `${sym}${m.priceIn.toFixed(2)}/1M` : `${sym}${m.priceIn.toFixed(2)}/1M in`;
  }
  if (m.priceIn <= 0 && m.priceOut <= 0) return "—";

  const fmt = (n: number) => (n < 0.01 ? n.toFixed(4) : n < 1 ? n.toFixed(3) : n.toFixed(2));
  return lang === "zh"
    ? `入 ${sym}${fmt(m.priceIn)} · 出 ${sym}${fmt(m.priceOut)}/1M`
    : `In ${sym}${fmt(m.priceIn)} · Out ${sym}${fmt(m.priceOut)}/1M`;
}
