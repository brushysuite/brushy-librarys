import { describe, it, expect, vi, beforeEach } from "vitest";
import { Container, cache } from "../index";

describe("Cache", () => {
  let container: Container;

  beforeEach(() => {
    cache.clear();
  });

  it("should cache promises manually", async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: "test" });

    const result1 = await cache.promise("test-key", () => fetchData());

    const result2 = await cache.promise("test-key", () => fetchData());

    expect(fetchData).toHaveBeenCalledTimes(1);
    expect(result1).toEqual({ data: "test" });
    expect(result2).toEqual({ data: "test" });
  });

  it("should clear cache", async () => {
    const fetchData = vi.fn().mockResolvedValue({ data: "test" });

    await cache.promise("test-key", () => fetchData());

    cache.clear();

    await cache.promise("test-key", () => fetchData());

    expect(fetchData).toHaveBeenCalledTimes(2);
  });

  it("should cache with different parameter types", async () => {
    const fetchData = vi
      .fn()
      .mockImplementation((id) => Promise.resolve({ id }));

    await cache.promise("string-key", () => fetchData("string"));

    await cache.promise(123, () => fetchData(123));

    const symbolKey = Symbol("test");
    await cache.promise(symbolKey, () => fetchData("symbol"));

    const objKey = { id: 1 };
    await cache.promise(objKey, () => fetchData("object"));

    expect(fetchData).toHaveBeenCalledTimes(4);
  });

  it("should clear cache for specific token", () => {
    cache.set("test-key", "test-value");
    cache.clear("test-key");
    expect(cache.get("test-key")).toBeNull();
  });

  it("should not cache rejected promises", async () => {
    const fetchError = vi.fn().mockRejectedValue(new Error("API Error"));

    try {
      await cache.promise("error-key", () => fetchError());
    } catch (error) {}

    try {
      await cache.promise("error-key", () => fetchError());
    } catch (error) {}

    expect(fetchError).toHaveBeenCalledTimes(2);
  });

  it("should respect cache expiration time", async () => {
    vi.useFakeTimers();
    const fetchData = vi.fn().mockResolvedValue({ data: "test" });

    await cache.promise("expiring-key", () => fetchData(), 1000);

    vi.advanceTimersByTime(2000);

    await cache.promise("expiring-key", () => fetchData(), 1000);

    expect(fetchData).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });

  it("should set and get cache values", () => {
    cache.set("test-key", "test-value");
    expect(cache.get("test-key")).toBe("test-value");
  });

  it("should handle object keys", () => {
    const objKey = { id: 1 };
    cache.set(JSON.stringify(objKey), "object-value");
    expect(cache.get(JSON.stringify(objKey))).toBe("object-value");
  });

  it("should handle cache expiration", () => {
    vi.useFakeTimers();
    cache.set("expiring-key", "expiring-value", 1000);
    expect(cache.get("expiring-key")).toBe("expiring-value");

    vi.advanceTimersByTime(2000);
    expect(cache.get("expiring-key")).toBeNull();

    vi.useRealTimers();
  });

  it("should handle null expiration", () => {
    cache.set("non-expiring-key", "non-expiring-value", undefined);
    expect(cache.get("non-expiring-key")).toBe("non-expiring-value");
  });

  it("should handle promise rejection in cache.promise", async () => {
    const fetchError = vi.fn().mockRejectedValue(new Error("API Error"));

    try {
      await cache.promise("error-key", () => fetchError());
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("API Error");
    }

    try {
      await cache.promise("error-key", () => fetchError());
    } catch (error) {
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe("API Error");
    }

    expect(fetchError).toHaveBeenCalledTimes(2);
  });

  it("should remove expired item from cache", () => {
    vi.useFakeTimers();
    cache.set("expiring-key", "expiring-value", 1000);
    vi.advanceTimersByTime(2000);
    expect(cache.get("expiring-key")).toBeNull();
    vi.useRealTimers();
  });

  it("should clear cache with object token", () => {
    const objToken = { id: 1 };
    cache.set(JSON.stringify(objToken), "test-value");
    cache.clear(objToken as any);
    expect(cache.get(JSON.stringify(objToken))).toBeNull();
  });

  it("should get cache with object key directly", () => {
    const objKey = { id: 1 };
    cache.set(objKey as any, "test-value");
    expect(cache.get(objKey as any)).toBe("test-value");
  });

  it("should set cache with object key directly", () => {
    const objKey = { id: 1 };
    const value = "test-value";
    cache.set(objKey as any, value);
    expect(cache.get(objKey as any)).toBe(value);
  });
});
