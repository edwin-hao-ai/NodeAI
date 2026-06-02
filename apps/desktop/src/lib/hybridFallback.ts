export const HYBRID_FALLBACK_KEY = "nodeai-hybrid-fallback";
export const HYBRID_FALLBACK_CONFIRM_KEY = "nodeai-hybrid-fallback-confirm";

export function loadHybridFallbackEnabled(): boolean {
  try {
    return localStorage.getItem(HYBRID_FALLBACK_KEY) === "1";
  } catch {
    return false;
  }
}

export function loadHybridFallbackConfirmed(): boolean {
  try {
    return localStorage.getItem(HYBRID_FALLBACK_CONFIRM_KEY) === "1";
  } catch {
    return false;
  }
}

export function saveHybridFallback(enabled: boolean, confirmed: boolean) {
  localStorage.setItem(HYBRID_FALLBACK_KEY, enabled ? "1" : "0");
  localStorage.setItem(HYBRID_FALLBACK_CONFIRM_KEY, enabled && confirmed ? "1" : "0");
}
