import { DEFAULT_PROMISE_TTL } from "./constants";
import { Token } from "../types";

export interface CachedPromise<T = unknown> {
  promise: Promise<T>;
  expiresAt: number;
}

/**
 * Unified promise cache - single source of truth for async method deduplication.
 */
export class PromiseCache {
  private store = new Map<string, CachedPromise>();

  createKey(token: Token, method: string, args: unknown[]): string {
    return `${String(token)}:${method}:${JSON.stringify(args)}`;
  }

  get<T>(key: string): Promise<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.promise as Promise<T>;
  }

  set<T>(key: string, promise: Promise<T>, ttl = DEFAULT_PROMISE_TTL): void {
    this.store.set(key, {
      promise,
      expiresAt: Date.now() + ttl,
    });
  }

  clear(token?: Token): void {
    if (!token) {
      this.store.clear();
      return;
    }

    const prefix = String(token);
    for (const key of this.store.keys()) {
      if (key.startsWith(prefix)) this.store.delete(key);
    }
  }
}
