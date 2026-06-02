import type { Lang } from "../i18n";
import type { I18nKey } from "../i18n";

const STORAGE = "nodeai-user-prefs";

export type ReplyLang = "zh" | "en" | "bilingual";

export interface UserPrefs {
  replyLang: ReplyLang;
}

const DEFAULT: UserPrefs = { replyLang: "zh" };

export function loadUserPrefs(): UserPrefs {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) return { ...DEFAULT, ...(JSON.parse(raw) as Partial<UserPrefs>) };
  } catch {
    /* ignore */
  }
  return { ...DEFAULT };
}

export function saveUserPrefs(patch: Partial<UserPrefs>): UserPrefs {
  const next = { ...loadUserPrefs(), ...patch };
  localStorage.setItem(STORAGE, JSON.stringify(next));
  window.dispatchEvent(new CustomEvent("nodeai-user-prefs", { detail: next }));
  return next;
}

export function replyLangStripKey(replyLang: ReplyLang): I18nKey {
  if (replyLang === "en") return "ctxStripReplyEn";
  if (replyLang === "bilingual") return "ctxStripReplyBi";
  return "ctxStripReplyZh";
}

export function replyLangSystemLine(replyLang: ReplyLang, uiLang: Lang): string {
  const lines: Record<ReplyLang, Record<Lang, string>> = {
    zh: {
      zh: "请默认使用中文回复用户。",
      en: "Default to replying in Chinese unless the user asks otherwise.",
    },
    en: {
      zh: "请默认使用英文回复用户。",
      en: "Default to replying in English unless the user asks otherwise.",
    },
    bilingual: {
      zh: "用户接受中英混合；技术术语可保留英文。",
      en: "User accepts Chinese/English mix; technical terms may stay in English.",
    },
  };
  return lines[replyLang][uiLang];
}
