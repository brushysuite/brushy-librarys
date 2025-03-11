import { promiseCacheSystem } from "..";
import { Token } from "../@types";

/**
 * Public API for managing the promise cache system.
 * Provides methods to cache, retrieve and clear cached values and promises.
 */
export const cache = {
  /** Internal cache storage */
  _cache: new Map<string, { value: any; expiry: number | null }>(),

  /**
   * Clears the cache for a specific token or the entire cache if no token is provided
   * @param token - Optional token to clear specific cache entry
   */
  clear: (token?: Token) => {
    promiseCacheSystem.clear(token);

    if (token) {
      const tokenKey =
        typeof token === "object" ? JSON.stringify(token) : String(token);
      cache._cache.delete(tokenKey);
    } else {
      cache._cache.clear();
    }
  },

  /**
   * Retrieves a cached value by key
   * @param key - The cache key to lookup
   * @returns The cached value or null if not found or expired
   */
  get(key: string): any {
    const cacheKey =
      typeof key === "object" ? JSON.stringify(key) : String(key);
    const item = this._cache.get(cacheKey);

    if (!item) return null;

    if (item.expiry && item.expiry < Date.now()) {
      this._cache.delete(cacheKey);
      return null;
    }

    return item.value;
  },

  /**
   * Sets a value in the cache with optional expiration
   * @param key - The cache key
   * @param value - The value to cache
   * @param expirationMs - Optional expiration time in milliseconds
   */
  set(key: string, value: any, expirationMs?: number): void {
    const cacheKey =
      typeof key === "object" ? JSON.stringify(key) : String(key);
    const expiry = expirationMs ? Date.now() + expirationMs : null;

    this._cache.set(cacheKey, { value, expiry });
  },

  /**
   * Caches the result of a promise function with optional expiration
   * @param key - The cache key
   * @param fn - The promise function to execute and cache
   * @param expirationMs - Optional expiration time in milliseconds
   * @returns Promise resolving to the cached or new value
   * @template T - The type of value returned by the promise
   */
  promise<T>(
    key: any,
    fn: () => Promise<T>,
    expirationMs?: number,
  ): Promise<T> {
    const cacheKey =
      typeof key === "object" ? JSON.stringify(key) : String(key);

    const cached = this.get(cacheKey);
    if (cached) {
      return Promise.resolve(cached);
    }

    return fn()
      .then((result) => {
        this.set(cacheKey, result, expirationMs);
        return result;
      })
      .catch((error) => {
        throw error;
      });
  },
};
