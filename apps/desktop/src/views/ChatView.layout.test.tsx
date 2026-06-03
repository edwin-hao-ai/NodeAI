import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Chat layout CSS contract", () => {
  it("locks viewport height and scrolls only .chat-scroll", () => {
    const css = readFileSync(resolve(__dirname, "../styles/app.css"), "utf8");
    expect(css).toMatch(/html,\s*\nbody\s*\{[^}]*overflow:\s*hidden/s);
    expect(css).toMatch(/#root\.shell-native-root\s*\{[^}]*max-height:\s*100dvh/s);
    expect(css).toMatch(/#root \.chat-scroll\s*\{[^}]*overflow-y:\s*auto/s);
    expect(css).toMatch(/#root \.composer-wrap\s*\{[^}]*flex-shrink:\s*0/s);
  });
});

describe("ChatView structure", () => {
  it("wraps scroll area and composer as siblings under .chat-view", () => {
    const src = readFileSync(resolve(__dirname, "ChatView.tsx"), "utf8");
    expect(src).toContain('<div className="chat-view">');
    expect(src).toContain('<div className="chat-body">');
    expect(src).toContain('<div className="chat-scroll" ref={scrollRef}');
    expect(src).toContain('<div className="composer-wrap">');
    const viewStart = src.indexOf('<div className="chat-view">');
    const composerIdx = src.indexOf('<div className="composer-wrap">');
    const bodyIdx = src.indexOf('<div className="chat-body">');
    expect(viewStart).toBeGreaterThan(-1);
    expect(bodyIdx).toBeGreaterThan(viewStart);
    expect(composerIdx).toBeGreaterThan(bodyIdx);
  });
});
