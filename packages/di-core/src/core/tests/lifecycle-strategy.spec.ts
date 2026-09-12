import { describe, expect, it } from "vitest";
import { createToken } from "../../types/tokens";
import {
  createLifecycleCache,
  LIFECYCLE_STRATEGIES,
  resolveLifecycleStrategy,
} from "../strategies/lifecycle";

describe("lifecycle strategies", () => {
  it("should expire singleton entries with ttl", () => {
    const cache = createLifecycleCache();
    const token = createToken("TTL");
    const strategy = LIFECYCLE_STRATEGIES.singleton;

    strategy.set(cache, token, { value: 1 }, 10);
    expect(strategy.get(cache, token, 10)).toEqual({ value: 1 });

    const wrapper = cache.singletons.get(token)!;
    wrapper.lastUsed = Date.now() - 20;

    expect(strategy.get(cache, token, 10)).toBeUndefined();
    expect(cache.singletons.has(token)).toBe(false);
  });

  it("should store and read immutable instances", () => {
    const cache = createLifecycleCache();
    const token = createToken("IMMUTABLE");
    const strategy = LIFECYCLE_STRATEGIES.immutable;
    const instance = { id: 1 };

    strategy.set(cache, token, instance);
    expect(strategy.get(cache, token)).toBe(instance);
  });

  it("should fall back to singleton strategy for unknown lifecycles", () => {
    expect(resolveLifecycleStrategy(undefined)).toBe(LIFECYCLE_STRATEGIES.singleton);
    expect(resolveLifecycleStrategy("singleton")).toBe(LIFECYCLE_STRATEGIES.singleton);
    expect(resolveLifecycleStrategy("unknown" as never)).toBe(LIFECYCLE_STRATEGIES.singleton);
  });

  it("should expose transient strategy storage hooks", () => {
    const cache = createLifecycleCache();
    const token = createToken("TRANSIENT");
    const strategy = LIFECYCLE_STRATEGIES.transient;

    expect(strategy.get(cache, token)).toBeUndefined();
    expect(() => strategy.set(cache, token, { id: 1 })).not.toThrow();
  });
});
