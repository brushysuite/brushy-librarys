import { describe, expect, it } from "vitest";
import { expireAtFromTtlSeconds, parseTtlToSeconds } from "./ttl";

describe("parseTtlToSeconds", () => {
  it("returns fallback when ttl is undefined", () => {
    expect(parseTtlToSeconds(undefined, 120)).toBe(120);
  });

  it("passes through numeric seconds including negative", () => {
    expect(parseTtlToSeconds(30, 0)).toBe(30);
    expect(parseTtlToSeconds(-1, 0)).toBe(-1);
    expect(parseTtlToSeconds(0, 99)).toBe(0);
  });

  it("parses duration shorthand to seconds", () => {
    expect(parseTtlToSeconds("35m", 0)).toBe(35 * 60);
    expect(parseTtlToSeconds("1h", 0)).toBe(3600);
    expect(parseTtlToSeconds("2d", 0)).toBe(2 * 86400);
    expect(parseTtlToSeconds("10s", 0)).toBe(10);
  });

  it("supports sub-second ms without rounding away", () => {
    expect(parseTtlToSeconds("500ms", 0)).toBe(0.5);
    expect(parseTtlToSeconds("1500ms", 0)).toBe(1.5);
  });

  it("defaults bare duration to seconds for set-style ttl", () => {
    expect(parseTtlToSeconds("60", 0)).toBe(60);
  });

  it("treats bare numeric strings as milliseconds for stdTTL", () => {
    expect(parseTtlToSeconds("60000", 0, { numericStringUnit: "ms" })).toBe(60);
    expect(parseTtlToSeconds("5000", 0, { numericStringUnit: "ms" })).toBe(5);
  });

  it("returns fallback for invalid strings", () => {
    expect(parseTtlToSeconds("not-a-ttl", 42)).toBe(42);
  });
});

describe("expireAtFromTtlSeconds", () => {
  it("maps ttl semantics to expire timestamps", () => {
    const now = 1_000_000;
    expect(expireAtFromTtlSeconds(0, now)).toBe(0);
    expect(expireAtFromTtlSeconds(-1, now)).toBe(now);
    expect(expireAtFromTtlSeconds(10, now)).toBe(now + 10_000);
    expect(expireAtFromTtlSeconds(0.5, now)).toBe(now + 500);
  });
});
