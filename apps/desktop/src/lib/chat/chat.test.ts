import { describe, expect, it } from "vitest";
import { buildMessageContent } from "./attachments";
import { drainSseBuffer } from "./sse";

describe("buildMessageContent", () => {
  it("returns plain text without attachments", () => {
    expect(buildMessageContent("hello", [])).toBe("hello");
  });

  it("inlines text file snippets", () => {
    const content = buildMessageContent("summarize", [
      {
        id: "1",
        name: "note.txt",
        kind: "file",
        textContent: "line one",
      },
    ]);
    expect(content).toContain("[附件 note.txt]");
    expect(content).toContain("line one");
    expect(content).toContain("summarize");
  });

  it("builds multimodal parts for images", () => {
    const content = buildMessageContent("describe", [
      {
        id: "2",
        name: "pic.png",
        kind: "image",
        dataUrl: "data:image/png;base64,abc",
      },
    ]);
    expect(Array.isArray(content)).toBe(true);
    const parts = content as Array<{ type: string }>;
    expect(parts.some((p) => p.type === "image_url")).toBe(true);
  });
});

describe("drainSseBuffer", () => {
  it("parses delta content from SSE chunk", () => {
    const chunk = drainSseBuffer(
      'data: {"choices":[{"delta":{"content":"Hi"}}]}\n\ndata: [DONE]\n\n',
    );
    expect(chunk.contentDeltas).toEqual(["Hi"]);
    expect(chunk.finished).toBe(true);
  });

  it("parses reasoning deltas", () => {
    const chunk = drainSseBuffer(
      'data: {"choices":[{"delta":{"reasoning_content":"think"}}]}\n\n',
    );
    expect(chunk.thinkingDeltas).toEqual(["think"]);
  });
});
