import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PromiseCacheSystem } from "../promise-cache-system";

describe("PromiseCacheSystem", () => {
  let cacheSystem: PromiseCacheSystem;

  beforeEach(() => {
    cacheSystem = new PromiseCacheSystem();

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

      const key = cacheSystem.createCacheKey(token, method, args);

      expect(key).toBe(`${token}:${method}:${JSON.stringify(args)}`);
    });

    it("should handle empty args", () => {
      const token = "TEST_TOKEN";
      const method = "fetchData";
      const args: any[] = [];

      const key = cacheSystem.createCacheKey(token, method, args);

      expect(key).toBe(`${token}:${method}:[]`);
    });
  });

  describe("setCachedPromise and getCachedPromise", () => {
    it("should store and retrieve a promise", () => {
      const key = "test-key";
      const promise = Promise.resolve("test-value");

      cacheSystem.setCachedPromise(key, promise);
      const cachedPromise = cacheSystem.getCachedPromise(key);

      expect(cachedPromise).toBe(promise);
      expect(cacheSystem["promiseTimestamps"].get(key)).toBe(1000);
    });

    it("should return undefined for non-existent key", () => {
      const cachedPromise = cacheSystem.getCachedPromise("non-existent-key");

      expect(cachedPromise).toBeUndefined();
    });
  });

  describe("isCacheValid", () => {
    it("should return true for valid cache entries", () => {
      const key = "valid-key";
      const promise = Promise.resolve("test-value");

      cacheSystem.setCachedPromise(key, promise);

      const isValid = cacheSystem.isCacheValid(key);

      expect(isValid).toBe(true);
    });

    it("should return false for expired cache entries", () => {
      const key = "expired-key";
      const promise = Promise.resolve("test-value");

      cacheSystem.setCachedPromise(key, promise);

      const ttl = cacheSystem["DEFAULT_TTL"];
      vi.spyOn(Date, "now").mockReturnValue(1000 + ttl + 1);

      const isValid = cacheSystem.isCacheValid(key);

      expect(isValid).toBe(false);
    });

    it("should return false for non-existent cache entries", () => {
      const isValid = cacheSystem.isCacheValid("non-existent-key");

      expect(isValid).toBe(false);
    });
  });

  describe("clear", () => {
    it("should clear all cache entries when no token is provided", () => {
      const key1 = "token1:method1:[]";
      const key2 = "token2:method2:[]";

      cacheSystem.setCachedPromise(key1, Promise.resolve("value1"));
      cacheSystem.setCachedPromise(key2, Promise.resolve("value2"));

      cacheSystem.clear();

      expect(cacheSystem.getCachedPromise(key1)).toBeUndefined();
      expect(cacheSystem.getCachedPromise(key2)).toBeUndefined();
      expect(cacheSystem["promiseCache"].size).toBe(0);
      expect(cacheSystem["promiseTimestamps"].size).toBe(0);
    });

    it("should clear only entries for the specified token", () => {
      const token1 = "token1";
      const token2 = "token2";

      const key1 = `${token1}:method1:[]`;
      const key2 = `${token1}:method2:[]`;
      const key3 = `${token2}:method1:[]`;

      cacheSystem.setCachedPromise(key1, Promise.resolve("value1"));
      cacheSystem.setCachedPromise(key2, Promise.resolve("value2"));
      cacheSystem.setCachedPromise(key3, Promise.resolve("value3"));

      cacheSystem.clear(token1);

      expect(cacheSystem.getCachedPromise(key1)).toBeUndefined();
      expect(cacheSystem.getCachedPromise(key2)).toBeUndefined();
      expect(cacheSystem.getCachedPromise(key3)).toBeDefined();
    });

    it("should handle Symbol tokens", () => {
      const symbolToken = Symbol("TEST_SYMBOL");
      const stringToken = String(symbolToken);

      const key1 = `${stringToken}:method1:[]`;
      const key2 = "other:method2:[]";

      cacheSystem.setCachedPromise(key1, Promise.resolve("value1"));
      cacheSystem.setCachedPromise(key2, Promise.resolve("value2"));

      cacheSystem.clear(symbolToken);

      expect(cacheSystem.getCachedPromise(key1)).toBeUndefined();
      expect(cacheSystem.getCachedPromise(key2)).toBeDefined();
    });
  });

  describe("Integration tests", () => {
    it("should work with a complete flow", () => {
      const token = "TEST_SERVICE";
      const method = "fetchData";
      const args = [123];

      const key = cacheSystem.createCacheKey(token, method, args);
      const promise = Promise.resolve("test-data");

      cacheSystem.setCachedPromise(key, promise);

      expect(cacheSystem.isCacheValid(key)).toBe(true);
      expect(cacheSystem.getCachedPromise(key)).toBe(promise);

      cacheSystem.clear(token);

      expect(cacheSystem.getCachedPromise(key)).toBeUndefined();
      expect(cacheSystem.isCacheValid(key)).toBe(false);
    });
  });
});
