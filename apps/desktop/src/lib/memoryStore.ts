import { DEMO } from "../data/demo";

export type MemoryTag = "pref" | "project" | "fact";

export interface MemoryItem {
  id: string;
  tag: MemoryTag;
  text: { zh: string; en: string };
  from: { zh: string; en: string };
  time: string;
}

const STORAGE = "nodeai-memories";

function seedMemories(): MemoryItem[] {
  return DEMO.MEMORIES.map((m, i) => ({
    id: `seed-${i}`,
    tag: m.tag as MemoryTag,
    text: m.text,
    from: m.from,
    time: m.time,
  }));
}

export function loadMemories(): MemoryItem[] {
  try {
    const raw = localStorage.getItem(STORAGE);
    if (raw) {
      const parsed = JSON.parse(raw) as MemoryItem[];
      if (Array.isArray(parsed) && parsed.length) return parsed;
    }
  } catch {
    /* ignore */
  }
  const seed = seedMemories();
  saveMemories(seed);
  return seed;
}

export function saveMemories(items: MemoryItem[]) {
  localStorage.setItem(STORAGE, JSON.stringify(items));
}

export function addMemory(item: Omit<MemoryItem, "id" | "time"> & { time?: string }): MemoryItem[] {
  const next: MemoryItem = {
    ...item,
    id: `m-${Date.now()}`,
    time: item.time ?? new Date().toISOString().slice(0, 10),
  };
  const all = [next, ...loadMemories()];
  saveMemories(all);
  return all;
}
