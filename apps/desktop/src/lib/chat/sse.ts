/** Incrementally parse OpenAI-compatible SSE from a text buffer. */
export function drainSseBuffer(buffer: string): {
  rest: string;
  deltas: string[];
  finished: boolean;
} {
  const deltas: string[] = [];
  let finished = false;
  const lines = buffer.split("\n");
  const rest = lines.pop() ?? "";

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.startsWith("data:")) continue;
    const data = line.slice(5).trimStart();
    if (data === "[DONE]") {
      finished = true;
      continue;
    }
    try {
      const json = JSON.parse(data) as {
        choices?: { delta?: { content?: string }; finish_reason?: string | null }[];
      };
      const delta = json.choices?.[0]?.delta?.content;
      if (delta) deltas.push(delta);
      if (json.choices?.[0]?.finish_reason) finished = true;
    } catch {
      /* ignore partial json */
    }
  }

  return { rest, deltas, finished };
}
