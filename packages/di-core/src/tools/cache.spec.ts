import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { createToken } from "../types/tokens";
import { cache } from "./cache";

describe("cache facade", () => {
  beforeEach(() => {
    cache.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should store and retrieve values", () => {
    cache.set("key", "value");
    expect(cache.get("key")).toBe("value");
  });

  it("should stringify primitive keys", () => {
    cache.set(123, "numeric");
    expect(cache.get("123")).toBe("numeric");
  });

  it("should stringify null keys as objects", () => {
    cache.set(null as unknown as string, "null-key");
    expect(cache.get("null")).toBe("null-key");
  });

  it("should stringify object keys", () => {
    const token = createToken("OBJECT_KEY");
    cache.set(token, "object-value");
    expect(cache.get(token)).toBe("object-value");
  });

  it("should expire cached values", () => {
    cache.set("expiring", "gone", 1_000);
    vi.advanceTimersByTime(1_001);
    expect(cache.get("expiring")).toBeNull();
  });

  it("should clear all caches when no token is provided", () => {
    cache.set("a", 1);
    cache.clear();
    expect(cache.get("a")).toBeNull();
  });

  it("should clear only the requested token", () => {
    const token = createToken("ONLY_THIS");
    cache.set("keep", "yes");
    cache.set(token, "no");
    cache.clear(token);
    expect(cache.get("keep")).toBe("yes");
    expect(cache.get(token)).toBeNull();
  });

  it("should memoize promise results", async () => {
    const fn = vi.fn(async () => "result");
    await expect(cache.promise("promise-key", fn)).resolves.toBe("result");
    await expect(cache.promise("promise-key", fn)).resolves.toBe("result");
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
