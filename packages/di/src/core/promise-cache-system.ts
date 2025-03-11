import { Token } from "../lib/@types";

/**
 * Manages the caching of promises for dependency injection.
 */
export class PromiseCacheSystem {
  private promiseCache = new Map<string, Promise<any>>();
  private promiseTimestamps = new Map<string, number>();
  private DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes

  createCacheKey(token: string, method: string, args: any[]): string {
    return `${token}:${method}:${JSON.stringify(args)}`;
  }

  isCacheValid(key: string): boolean {
    const timestamp = this.promiseTimestamps.get(key);
    return timestamp !== undefined && Date.now() - timestamp < this.DEFAULT_TTL;
  }

  clear(token?: Token): void {
    if (!token) {
      this.promiseCache.clear();
      this.promiseTimestamps.clear();
      return;
    }

    const prefix = String(token);
    [...this.promiseCache.keys()].forEach((key) => {
      if (key.startsWith(prefix)) {
        this.promiseCache.delete(key);
        this.promiseTimestamps.delete(key);
      }
    });
  }

  getCachedPromise(key: string): Promise<any> | undefined {
    return this.promiseCache.get(key);
  }

  setCachedPromise(key: string, promise: Promise<any>): void {
    this.promiseCache.set(key, promise);
    this.promiseTimestamps.set(key, Date.now());
  }
}
