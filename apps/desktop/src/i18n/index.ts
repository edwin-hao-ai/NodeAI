import en from "./en.json";
import zh from "./zh.json";

export type Lang = "zh" | "en";
export type I18nKey = keyof typeof zh;

const tables = { zh, en } as const;

export function t(lang: Lang, key: I18nKey): string {
  const table = tables[lang];
  return (table[key] as string | undefined) ?? zh[key] ?? key;
}

export function loc<T extends { zh: string; en: string }>(lang: Lang, o: T): string {
  return o[lang];
}
