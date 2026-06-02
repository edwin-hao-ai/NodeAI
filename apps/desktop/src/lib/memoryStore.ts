import type { Lang } from "../i18n";

export type MemoryTag = "pref" | "project" | "fact";

export interface MemoryItem {
  id: string;
  tag: MemoryTag;
  text: { zh: string; en: string };
  from: { zh: string; en: string };
  time: string;
}

interface MemoryRow {
  id: string;
  tag: string;
  text_zh: string;
  text_en: string;
  from_zh: string;
  from_en: string;
  created_at: string;
}

function rowToItem(row: MemoryRow): MemoryItem {
  return {
    id: row.id,
    tag: row.tag as MemoryTag,
    text: { zh: row.text_zh, en: row.text_en },
    from: { zh: row.from_zh, en: row.from_en },
    time: row.created_at,
  };
}

export async function fetchMemories(baseUrl: string): Promise<MemoryItem[]> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/nodeai/memories`);
    if (!resp.ok) return [];
    const data = (await resp.json()) as { memories?: MemoryRow[] };
    return (data.memories ?? []).map(rowToItem);
  } catch {
    return [];
  }
}

export async function createMemory(
  baseUrl: string,
  text: string,
  tag: MemoryTag,
  lang: Lang,
): Promise<MemoryItem | null> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/nodeai/memories`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tag,
        text_zh: text,
        text_en: text,
        from_zh: lang === "zh" ? "手动添加" : "Manual",
        from_en: "Manual",
      }),
    });
    if (!resp.ok) return null;
    const data = (await resp.json()) as { memory?: MemoryRow };
    return data.memory ? rowToItem(data.memory) : null;
  } catch {
    return null;
  }
}

export async function deleteMemory(baseUrl: string, id: string): Promise<boolean> {
  try {
    const resp = await fetch(`${baseUrl.replace(/\/$/, "")}/nodeai/memories/${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    return resp.ok || resp.status === 204;
  } catch {
    return false;
  }
}
