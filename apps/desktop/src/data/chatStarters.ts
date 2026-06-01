export type StarterPersona = "chat" | "ide" | "both" | "byok" | "team";

export const STARTER_PROMPTS: Record<
  StarterPersona,
  { zh: string[]; en: string[] }
> = {
  chat: {
    zh: [
      "帮我把这段话润色得更专业",
      "写一条产品发布朋友圈文案",
      "把这份会议记录总结成要点",
    ],
    en: [
      "Polish this paragraph",
      "Write a launch post",
      "Summarize these meeting notes",
    ],
  },
  ide: {
    zh: [
      "解释这段报错并给出修复",
      "把这个函数重构得更易读",
      "给这段代码补单元测试",
    ],
    en: [
      "Explain this error & fix it",
      "Refactor this function",
      "Add unit tests for this",
    ],
  },
  both: {
    zh: [
      "帮我整理 README 安装说明",
      "把需求拆成开发任务清单",
      "审查这段代码的安全问题",
    ],
    en: [
      "Write README install docs",
      "Break this into dev tasks",
      "Review this code for security",
    ],
  },
  byok: {
    zh: ["写个快排试试", "总结这个网页链接的要点", "翻译这段技术文档"],
    en: ["Write a quicksort", "Summarize this URL", "Translate this tech doc"],
  },
  team: {
    zh: [
      "本月哪个应用花得最多？",
      "写预算告警的策略说明",
      "对比 Sonnet 与 Flash 性价比",
    ],
    en: [
      "Which app spent most this month?",
      "Draft a budget-alert policy",
      "Compare Sonnet vs Flash value",
    ],
  },
};

export function getStarterPrompts(
  lang: "zh" | "en",
  persona: StarterPersona = "both",
): string[] {
  const pack = STARTER_PROMPTS[persona] ?? STARTER_PROMPTS.both;
  return pack[lang] ?? pack.zh;
}
