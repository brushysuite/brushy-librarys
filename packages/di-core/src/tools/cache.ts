import { promiseCache, promiseCacheSystem } from "../registry";
import { Token } from "../types";

const toKey = (key: unknown): string =>
  typeof key === "object" ? JSON.stringify(key) : String(key);

export const cache = {
  _cache: new Map<string, { value: unknown; expiry: number | null }>(),

  clear: (token?: Token) => {
    promiseCache.clear(token);
    promiseCacheSystem.clear(token);

    if (!token) {
      cache._cache.clear();
      return;
    }

    cache._cache.delete(toKey(token));
  },

  get(key: string): unknown {
    const item = cache._cache.get(toKey(key));
    if (!item) return null;
    if (item.expiry && item.expiry < Date.now()) {
      cache._cache.delete(toKey(key));
      return null;
    }
    return item.value;
  },

  set(key: string, value: unknown, expirationMs?: number): void {
    cache._cache.set(toKey(key), {
      value,
      expiry: expirationMs ? Date.now() + expirationMs : null,
    });
  },

  promise<T>(key: string, fn: () => Promise<T>, expirationMs?: number): Promise<T> {
    const cached = cache.get(key);
    if (cached) return Promise.resolve(cached as T);

    return fn().then((result) => {
      cache.set(key, result, expirationMs);
      return result;
    });
  },
};
