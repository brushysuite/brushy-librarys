import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { resetBusRegistry } from "./bus";
import { createStorage, resetStorageRegistry } from "./cache";

describe("createStorage", () => {
  beforeEach(() => {
    resetStorageRegistry();
    resetBusRegistry();
    vi.useFakeTimers();
  });

  afterEach(() => {
    resetStorageRegistry();
    resetBusRegistry();
    vi.useRealTimers();
  });

  it("sets and gets values", () => {
    const cache = createStorage({ id: "test-basic" });
    cache.set("foo", "bar");
    expect(cache.get("foo")).toBe("bar");
  });

  it("returns undefined for missing keys", () => {
    const cache = createStorage({ id: "test-missing" });
    expect(cache.get("missing")).toBeUndefined();
  });

  it("deletes keys", () => {
    const cache = createStorage({ id: "test-del" });
    cache.set("foo", "bar");
    expect(cache.del("foo")).toBe(1);
    expect(cache.get("foo")).toBeUndefined();
  });

  it("expires keys after ttl seconds", () => {
    const cache = createStorage({ id: "test-ttl", checkperiod: 0 });
    cache.set("session", "token", 1);
    expect(cache.get("session")).toBe("token");

    vi.advanceTimersByTime(1001);
    expect(cache.get("session")).toBeUndefined();
  });

  it("parses shorthand ttl", () => {
    const cache = createStorage({ id: "test-shorthand", checkperiod: 0 });
    cache.set("key", "value", "1s");
    vi.advanceTimersByTime(1001);
    expect(cache.get("key")).toBeUndefined();
  });

  it("emits expired on checkperiod", () => {
    const cache = createStorage({ id: "test-expired-event", checkperiod: 1 });
    const expired = vi.fn();
    cache.on("expired", expired);
    cache.set("key", "value", 1);

    vi.advanceTimersByTime(2000);
    expect(expired).toHaveBeenCalledWith("key", "value");
  });

  it("take returns and removes value", () => {
    const cache = createStorage({ id: "test-take" });
    cache.set("foo", 42);
    expect(cache.take("foo")).toBe(42);
    expect(cache.get("foo")).toBeUndefined();
  });

  it("flushAll clears keys", () => {
    const cache = createStorage({ id: "test-flush" });
    cache.set("a", 1);
    cache.set("b", 2);
    cache.flushAll();
    expect(cache.keys()).toEqual([]);
  });

  it("reuses instance for same id", () => {
    const a = createStorage({ id: "shared" });
    const b = createStorage({ id: "shared" });
    expect(a).toBe(b);
  });

  it("syncs invalidation between instances with same id", () => {
    const a = createStorage({ id: "sync-id" });
    const b = createStorage({ id: "sync-id" });
    a.set("token", "abc");
    expect(b.get("token")).toBe("abc");
    a.del("token");
    expect(b.get("token")).toBeUndefined();
  });

  it("throws when maxKeys is exceeded", () => {
    const cache = createStorage({ id: "test-max", maxKeys: 1 });
    cache.set("a", 1);
    expect(() => cache.set("b", 2)).toThrow("maxKeys");
  });

  it("persists to local storage when enabled", () => {
    const cache = createStorage({ id: "test-persist", persist: "local", prefix: "@test:" });
    cache.set("theme", "dark");
    cache.close();

    const reloaded = createStorage({ id: "test-persist-reload", persist: "local", prefix: "@test:" });
    expect(reloaded.get("theme")).toBe("dark");
    reloaded.close();
  });

  it("close stops checkperiod timer", () => {
    const cache = createStorage({ id: "test-close", checkperiod: 1 });
    cache.close();
    expect(cache.set("x", 1)).toBe(false);
  });
});
