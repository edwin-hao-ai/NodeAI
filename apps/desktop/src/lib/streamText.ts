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
  onUpdate("");
  const id = window.setInterval(() => {
    i += 1;
    onUpdate(full.slice(0, i));
    if (i >= full.length) {
      window.clearInterval(id);
      onDone();
    }
  }, charMs);
  return () => window.clearInterval(id);
}
