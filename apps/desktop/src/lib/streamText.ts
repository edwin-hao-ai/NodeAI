/** Reveal text incrementally; returns cancel function. */
export function streamText(
  full: string,
  onUpdate: (partial: string) => void,
  onDone: () => void,
  charMs = 16,
): () => void {
  if (!full.length) {
    onDone();
    return () => {};
  }
  let i = 0;
  let cancelled = false;
  onUpdate("");
  const id = globalThis.setInterval(() => {
    if (cancelled) return;
    i += 1;
    onUpdate(full.slice(0, i));
    if (i >= full.length) {
      globalThis.clearInterval(id);
      if (!cancelled) onDone();
    }
  }, charMs);
  return () => {
    cancelled = true;
    globalThis.clearInterval(id);
  };
}
