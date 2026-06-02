import type { CompressionProfile } from "../bonusApi";

export interface BonusCardDef {
  id: string;
  icon: string;
  name: { zh: string; en: string };
  sub: { zh: string; en: string };
  isOn: (profile: CompressionProfile) => boolean;
  soon?: boolean;
}

export const BONUS_CARDS: BonusCardDef[] = [
  {
    id: "compress",
    icon: "compress",
    name: { zh: "智能压缩", en: "Smart compress" },
    sub: { zh: "日志 / diff 自动瘦身", en: "Slim logs & diffs" },
    isOn: (p) => p.rtk,
  },
  {
    id: "concise",
    icon: "short_text",
    name: { zh: "简洁回复", en: "Concise replies" },
    sub: { zh: "减少啰嗦输出", en: "Less verbose output" },
    isOn: (p) => p.caveman_level > 0,
  },
  {
    id: "route",
    icon: "auto_awesome",
    name: { zh: "智能选模型", en: "Auto model" },
    sub: { zh: "简单任务走便宜模型", en: "Cheap model for easy tasks" },
    isOn: (p) => p.smart_route,
  },
  {
    id: "failover",
    icon: "sync_alt",
    name: { zh: "限流自动换路", en: "Auto failover" },
    sub: { zh: "429 时无缝切换", en: "Seamless on 429" },
    isOn: (p) => p.failover,
  },
  {
    id: "memory",
    icon: "neurology",
    name: { zh: "记忆", en: "Memory" },
    sub: { zh: "跨 App 共享偏好", en: "Shared prefs across apps" },
    isOn: (p) => p.memory_inject,
  },
  {
    id: "appbill",
    icon: "apps",
    name: { zh: "按应用账单", en: "Per-app billing" },
    sub: { zh: "Cursor / Chat 分开算", en: "Split Cursor vs Chat" },
    isOn: () => true,
  },
  {
    id: "prune",
    icon: "content_cut",
    name: { zh: "上下文整理", en: "Context prune" },
    sub: { zh: "长对话摘要 · v0.2", en: "Long chat summary · v0.2" },
    isOn: (p) => p.prune,
  },
];
