import { describe, expect, it } from "vitest";
import { flagshipScore } from "./flagship";

describe("flagshipScore", () => {
  it("ranks newer flagship models higher", () => {
    expect(flagshipScore("anthropic/claude-opus-4")).toBeGreaterThan(
      flagshipScore("anthropic/claude-3-haiku"),
    );
    expect(flagshipScore("google/gemini-2.5-pro")).toBeGreaterThan(
      flagshipScore("google/gemini-2.0-flash-lite"),
    );
  });
});
