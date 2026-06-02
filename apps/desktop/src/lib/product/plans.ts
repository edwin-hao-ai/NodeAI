export interface PlanDefinition {
  id: "free" | "pro" | "team";
  price: number;
  allowance: number;
  featured: boolean;
  feats: string[];
}

export const PRODUCT_PLANS: PlanDefinition[] = [
  {
    id: "free",
    price: 0,
    allowance: 12,
    featured: false,
    feats: ["planFeatApps1", "planFeatAllow12", "planFeatCompressBasic", "planFeatBill7d", "planFeatNo"],
  },
  {
    id: "pro",
    price: 29,
    allowance: 48,
    featured: true,
    feats: [
      "planFeatAppsUnlim",
      "planFeatAllow48",
      "planFeatCompressFull",
      "planFeatLive",
      "planFeatMemory",
      "planFeatByok",
      "planFeatBillFull",
    ],
  },
  {
    id: "team",
    price: 99,
    allowance: 180,
    featured: false,
    feats: [
      "planFeatSeats3",
      "planFeatAllow180",
      "planFeatCompressFull",
      "planFeatLive",
      "planFeatMemory",
      "planFeatByok",
      "planFeatAudit",
    ],
  },
];

/** Map Cloud user.plan slug → product plan id. */
export function resolvePlanId(cloudPlan: string | undefined): "free" | "pro" | "team" {
  if (!cloudPlan || cloudPlan === "free") return "free";
  if (cloudPlan === "team") return "team";
  return "pro";
}

export function planAllowance(cloudPlan: string | undefined): number {
  const id = resolvePlanId(cloudPlan);
  return PRODUCT_PLANS.find((p) => p.id === id)?.allowance ?? 48;
}

export function isTrialPlan(cloudPlan: string | undefined): boolean {
  return cloudPlan === "pro-trial";
}
