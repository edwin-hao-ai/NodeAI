/** True when UI runs inside the Tauri desktop shell (not Vite-only browser). */
export function isTauriShell(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}
