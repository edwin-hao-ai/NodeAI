const STORAGE = "nodeai-chat-ctx-pref";

export function loadChatContextPref(): string {
  try {
    return localStorage.getItem(STORAGE) ?? "";
  } catch {
    return "";
  }
}

export function saveChatContextPref(text: string): void {
  try {
    const trimmed = text.trim();
    if (trimmed) localStorage.setItem(STORAGE, trimmed);
    else localStorage.removeItem(STORAGE);
  } catch {
    /* ignore */
  }
}
