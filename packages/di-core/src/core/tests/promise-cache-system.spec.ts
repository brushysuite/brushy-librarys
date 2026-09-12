import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PromiseCache } from "../promise-cache";

describe("PromiseCache", () => {
  let cacheSystem: PromiseCache;

  beforeEach(() => {
    cacheSystem = new PromiseCache();
    vi.spyOn(Date, "now").mockReturnValue(1000);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("createCacheKey", () => {
    it("should create a cache key from token, method and args", () => {
      const token = "TEST_TOKEN";
      const method = "fetchData";
      const args = [123, "test", { id: 456 }];

      const key = cacheSystem.createKey(token, method, args);

      expect(key).toBe(`${token}:${method}:${JSON.stringify(args)}`);
    });

    it("should handle empty args", () => {
      const token = "TEST_TOKEN";
      const method = "fetchData";

      const key = cacheSystem.createKey(token, method, []);

      expect(key).toBe(`${token}:${method}:[]`);
    });
  });

  describe("cache operations", () => {
    it("should store and retrieve cached promises", async () => {
      const key = "test-key";
      const promise = Promise.resolve("test-value");

      cacheSystem.set(key, promise);
      const cached = cacheSystem.get(key);

      expect(cached).toBe(promise);
      await expect(cached).resolves.toBe("test-value");
    });

    it("should return undefined for expired cache entries", () => {
      const key = "expired-key";
      const promise = Promise.resolve("value");

      cacheSystem.set(key, promise, 1000);
      vi.spyOn(Date, "now").mockReturnValue(3000);

      expect(cacheSystem.get(key)).toBeUndefined();
    });

    it("should clear all cache when no token is provided", () => {
      cacheSystem.set("key1", Promise.resolve(1));
      cacheSystem.set("key2", Promise.resolve(2));

      cacheSystem.clear();

      expect(cacheSystem.get("key1")).toBeUndefined();
      expect(cacheSystem.get("key2")).toBeUndefined();
    });

    it("should clear cache for specific token prefix", () => {
      const token = "USER_SERVICE";
      cacheSystem.set(`${token}:get:[]`, Promise.resolve(1));
      cacheSystem.set("OTHER:get:[]", Promise.resolve(2));

      cacheSystem.clear(token);

      expect(cacheSystem.get(`${token}:get:[]`)).toBeUndefined();
      expect(cacheSystem.get("OTHER:get:[]")).toBeDefined();
    });
  });
});
