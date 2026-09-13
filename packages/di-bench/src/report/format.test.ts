import { describe, expect, it } from "vitest";
import { formatHz, formatMs, formatPct, nsToMs, pad } from "./format.js";

describe("report format helpers", () => {
  it("formats throughput units", () => {
    expect(formatHz(500)).toBe("500/s");
    expect(formatHz(2500)).toBe("2.50K/s");
    expect(formatHz(2_500_000)).toBe("2.50M/s");
  });

  it("formats latency and percentages", () => {
    expect(nsToMs(2_000_000)).toBe(2);
    expect(formatMs(1_500_000)).toBe("1.5000ms");
    expect(formatPct(undefined)).toBe("N/A");
    expect(formatPct(12.3)).toBe("+12.3%");
    expect(formatPct(-4)).toBe("-4.0%");
  });

  it("pads strings to width", () => {
    expect(pad("abc", 5)).toBe("abc  ");
    expect(pad("abcdef", 4)).toBe("abcdef");
  });
});
