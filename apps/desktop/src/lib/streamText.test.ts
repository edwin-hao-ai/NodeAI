import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { streamText } from "./streamText";

describe("streamText", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls onDone immediately for empty text", () => {
    const onDone = vi.fn();
    streamText("", vi.fn(), onDone);
    expect(onDone).toHaveBeenCalledOnce();
  });

  it("does not call onDone after cancel", () => {
    const onDone = vi.fn();
    const cancel = streamText("hi", vi.fn(), onDone, 50);
    vi.advanceTimersByTime(50);
    cancel();
    vi.advanceTimersByTime(200);
    expect(onDone).not.toHaveBeenCalled();
  });
});
