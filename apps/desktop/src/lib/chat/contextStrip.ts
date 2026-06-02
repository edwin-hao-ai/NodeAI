import type { I18nKey, Lang } from "../../i18n";
import type { MemoryItem } from "../memoryStore";
import { replyLangStripKey, type ReplyLang } from "../userPrefs";

export function memorySnippetsForStrip(memories: MemoryItem[], lang: Lang, max = 3): string[] {
  return memories
    .slice(0, max)
    .map((m) => (m.text[lang] || m.text.zh).trim().replace(/\s+/g, " "))
    .filter(Boolean)
    .map((s) => (s.length > 40 ? `${s.slice(0, 40)}…` : s));
}

export function contextStripSummaryText(
  ctxDraft: string,
  memories: MemoryItem[],
  replyLang: ReplyLang,
  lang: Lang,
  tr: (key: I18nKey) => string,
): string | null {
  const draft = ctxDraft.trim();
  if (draft) return draft.length > 72 ? `${draft.slice(0, 72)}…` : draft;
  const snippets = memorySnippetsForStrip(memories, lang);
  if (snippets.length > 0) return snippets.join(" · ");
  return tr(replyLangStripKey(replyLang));
}

/** Strip always visible: at minimum shows reply-language pref from settings. */
export function shouldShowContextStrip(): boolean {
  return true;
}
