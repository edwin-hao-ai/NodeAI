/** Known apps — product config (not runtime fake metrics). */
export interface AppTemplate {
  id: string;
  icon: string;
  color: string;
  key: string;
  name: { zh: string; en: string };
  builtin?: boolean;
  steps?: { zh: string[]; en: string[] };
}

export const KNOWN_APPS: AppTemplate[] = [
  {
    id: "cursor",
    icon: "code",
    color: "var(--app-cursor)",
    key: "sk-nodeai-cursor",
    name: { zh: "Cursor", en: "Cursor" },
    steps: {
      zh: [
        "打开 Cursor → Settings → Models",
        "开启 Override OpenAI Base URL",
        "粘贴上方共用地址",
        "API Key 粘贴 Cursor 专用码",
        "保存后问一句代码问题 — 总览会出现 Cursor 调用",
      ],
      en: [
        "Cursor → Settings → Models",
        "Enable Override OpenAI Base URL",
        "Paste shared address above",
        "Paste Cursor access code as API Key",
        "Ask a coding question — Cursor shows on Hub",
      ],
    },
  },
  {
    id: "claude-code",
    icon: "terminal",
    color: "var(--app-claude)",
    key: "sk-nodeai-claude-code",
    name: { zh: "Claude Code", en: "Claude Code" },
    steps: {
      zh: [
        "在 Claude Code 设置中找到 API 配置",
        "填入共用地址与 Claude Code 专用码",
        "首次请求后此处显示「已连接」",
      ],
      en: [
        "Open Claude Code API settings",
        "Paste shared address + Claude Code code",
        "First request marks as connected",
      ],
    },
  },
  {
    id: "nodeai-chat",
    icon: "chat",
    color: "var(--app-chat)",
    key: "sk-nodeai-chat",
    name: { zh: "NodeAI 对话", en: "NodeAI Chat" },
    builtin: true,
  },
  {
    id: "cline",
    icon: "extension",
    color: "var(--app-bot)",
    key: "sk-nodeai-cline",
    name: { zh: "Cline", en: "Cline" },
    steps: {
      zh: [
        "在 VS Code 安装 Cline 扩展",
        "API 设置中填入地址与 Cline 专用码",
        "发送第一条消息后自动识别为 Cline",
      ],
      en: [
        "Install Cline in VS Code",
        "Paste address + Cline code in API settings",
        "First message identifies as Cline",
      ],
    },
  },
];

export const APP_TEMPLATES = [
  { id: "continue", icon: "play_circle", color: "#FF6B35", name: { zh: "Continue", en: "Continue" } },
  { id: "codex", icon: "terminal", color: "#10A37F", name: { zh: "OpenAI Codex", en: "OpenAI Codex" } },
  { id: "windsurf", icon: "surfing", color: "var(--secondary)", name: { zh: "Windsurf", en: "Windsurf" } },
  { id: "aider", icon: "smart_toy", color: "var(--app-claude)", name: { zh: "Aider", en: "Aider" } },
  { id: "openclaw", icon: "pets", color: "var(--app-bot)", name: { zh: "OpenClaw", en: "OpenClaw" } },
  { id: "hermes", icon: "psychology", color: "#B388FF", name: { zh: "Hermes Agent", en: "Hermes Agent" } },
  { id: "custom", icon: "edit", color: "var(--on-surface-variant)", name: { zh: "自定义", en: "Custom" } },
] as const;

export function appTemplateById(id: string): AppTemplate | undefined {
  return KNOWN_APPS.find((a) => a.id === id);
}

export function slugFromAppKey(key: string): string | undefined {
  const m = key.match(/^sk-nodeai-(.+)$/);
  return m?.[1];
}

export function templateForUsageSlug(slug: string): AppTemplate | undefined {
  return KNOWN_APPS.find((a) => a.id === slug || a.key === `sk-nodeai-${slug}`);
}
