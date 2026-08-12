import { describe, expect, it } from "vitest";
import { createToken } from "../../types/tokens";
import { createLifecycleCache } from "../strategies/lifecycle";
import { clearScopeBucket, getScopeBucketForKey } from "../scoped-cache";

describe("scoped cache", () => {
  it("should clear an explicit scope bucket", () => {
    const cache = createLifecycleCache();
    const scope = { id: "scope-a" };
    const token = createToken("SCOPED");

    getScopeBucketForKey(cache, scope).set(token, { instance: "value", lastUsed: 0 });
    expect(getScopeBucketForKey(cache, scope).size).toBe(1);

    clearScopeBucket(cache, scope);
    expect(cache.scoped.has(scope)).toBe(false);
  });
});
