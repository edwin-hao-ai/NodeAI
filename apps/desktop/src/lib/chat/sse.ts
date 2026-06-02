/** Incrementally parse OpenAI-compatible SSE from a text buffer. */
export interface SseDrainResult {
  rest: string;
  contentDeltas: string[];
  thinkingDeltas: string[];
  toolCallDeltas: Record<string, unknown>[];
  finished: boolean;
}

function extractThinking(delta: Record<string, unknown> | undefined): string | null {
  if (!delta) return null;
  for (const key of ["reasoning_content", "reasoning", "thinking"] as const) {
    const value = delta[key];
    if (typeof value === "string" && value.length > 0) return value;
  }
  return null;
}

export function drainSseBuffer(buffer: string): SseDrainResult {
  const contentDeltas: string[] = [];
  const thinkingDeltas: string[] = [];
  const toolCallDeltas: Record<string, unknown>[] = [];
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
        choices?: {
          delta?: Record<string, unknown>;
          finish_reason?: string | null;
        }[];
      };
      const delta = json.choices?.[0]?.delta;
      const content = delta?.content;
      if (typeof content === "string" && content) contentDeltas.push(content);
      const thinking = extractThinking(delta);
      if (thinking) thinkingDeltas.push(thinking);
      if (delta?.tool_calls) toolCallDeltas.push(delta);
      if (json.choices?.[0]?.finish_reason) finished = true;
    } catch {
      /* ignore partial json */
    }
  }

  return { rest, contentDeltas, thinkingDeltas, toolCallDeltas, finished };
}

/** @deprecated use contentDeltas from SseDrainResult */
export function drainSseBufferLegacy(buffer: string): {
  rest: string;
  deltas: string[];
  finished: boolean;
} {
  const parsed = drainSseBuffer(buffer);
  return {
    rest: parsed.rest,
    deltas: parsed.contentDeltas,
    finished: parsed.finished,
  };
}
