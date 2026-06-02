const STORAGE_FAV = "nodeai-fav-models";
const STORAGE_RECENT = "nodeai-recent-models";

export function loadFavModels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_FAV) || "[]");
  } catch {
    return [];
  }
}

export function saveFavModels(ids: string[]) {
  localStorage.setItem(STORAGE_FAV, JSON.stringify(ids));
}

export function loadRecentModels(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_RECENT) || "[]");
  } catch {
    return [];
  }
}

export function pushRecentModel(id: string) {
  const next = [id, ...loadRecentModels().filter((x) => x !== id)].slice(0, 5);
  localStorage.setItem(STORAGE_RECENT, JSON.stringify(next));
}

export function toggleFavModel(id: string): string[] {
  const favs = loadFavModels();
  const next = favs.includes(id) ? favs.filter((x) => x !== id) : [id, ...favs];
  saveFavModels(next);
  return next;
}
