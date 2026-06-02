/** Accumulate OpenAI-compatible streaming tool call deltas. */
export class ToolCallAccumulator {
  private calls = new Map<number, { id?: string; name?: string; args: string }>();

  ingest(delta: Record<string, unknown> | undefined) {
    const raw = delta?.tool_calls;
    if (!Array.isArray(raw)) return;
    for (const item of raw) {
      if (!item || typeof item !== "object") continue;
      const row = item as {
        index?: number;
        id?: string;
        function?: { name?: string; arguments?: string };
      };
      const index = row.index ?? 0;
      const prev = this.calls.get(index) ?? { args: "" };
      if (row.id) prev.id = row.id;
      if (row.function?.name) prev.name = row.function.name;
      if (row.function?.arguments) prev.args += row.function.arguments;
      this.calls.set(index, prev);
    }
  }

  build(): Array<{ id: string; type: "function"; function: { name: string; arguments: string } }> {
    return [...this.calls.entries()]
      .sort(([a], [b]) => a - b)
      .map(([, value]) => value)
      .filter((value) => value.id && value.name)
      .map((value) => ({
        id: value.id!,
        type: "function" as const,
        function: { name: value.name!, arguments: value.args || "{}" },
      }));
  }

  reset() {
    this.calls.clear();
  }
}
