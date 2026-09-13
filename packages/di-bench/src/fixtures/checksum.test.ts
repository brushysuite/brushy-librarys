import { beforeEach, describe, expect, it } from "vitest";
import { consumeChecksum, getGlobalChecksum, resetGlobalChecksum } from "./checksum.js";

describe("consumeChecksum", () => {
  beforeEach(() => {
    resetGlobalChecksum();
  });

  it("handles nullish, boolean, number, string and object shapes", () => {
    expect(consumeChecksum(null)).toBeTypeOf("number");
    expect(consumeChecksum(undefined)).toBeTypeOf("number");
    expect(consumeChecksum(true)).toBeTypeOf("number");
    expect(consumeChecksum(false)).toBeTypeOf("number");
    expect(consumeChecksum(1.25)).toBeTypeOf("number");
    expect(consumeChecksum("abc")).toBeTypeOf("number");
    expect(consumeChecksum({ value: 2, id: 1.5, idx: 3 })).toBeTypeOf("number");
    expect(getGlobalChecksum()).not.toBe(0);
  });

  it("falls back for unsupported value types", () => {
    expect(consumeChecksum(Symbol("x"))).toBe(1);
    expect(consumeChecksum(() => {})).toBe(1);
  });

  it("resets global checksum", () => {
    consumeChecksum("seed");
    resetGlobalChecksum();
    expect(getGlobalChecksum()).toBe(0);
  });
});
