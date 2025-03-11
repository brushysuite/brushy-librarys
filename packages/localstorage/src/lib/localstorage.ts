import { compress, decompress } from "lz-string";
import {
  IStorage,
  StorageEventListener,
  StorageItem,
  StorageOptions,
} from "../core/types";

/**
 * Checks if the current environment supports localStorage.
 */
const isClient = typeof globalThis !== "undefined" && !!globalThis.localStorage;

if (!isClient) {
  console.warn(
    "[LocalStorage] This library requires an environment with localStorage support.",
  );
}

/**
 * A class that provides an enhanced interface to the browser's localStorage.
 * It supports features like TTL (time-to-live), compression, and event listeners.
 *
 * @example
 * ```typescript
 * const storage = new LocalStorage();
 * storage.set('user', { name: 'John', age: 30 }, { ttl: 3600000, compress: true });
 * const user = storage.get('user');
 * console.log(user); // { name: 'John', age: 30 }
 * ```
 */
export class LocalStorage implements IStorage {
  private listeners: Map<string, Set<StorageEventListener>> = new Map();
  private storage: Storage;

  /**
   * Creates a new instance of LocalStorage with an optional prefix for keys.
   *
   * @param prefix - The prefix to use for all stored keys. Defaults to '@brushy/storage:'.
   * @throws {Error} If the environment does not support localStorage.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage('@myapp:');
   * ```
   */
  constructor(private prefix: string = "@brushy/storage:") {
    if (!isClient) {
      throw new Error(
        "[LocalStorage] This library requires an environment with localStorage support.",
      );
    }
    this.storage = globalThis.localStorage;
  }

  /**
   * Stores a value in localStorage with optional TTL and compression.
   *
   * @template T - The type of the value to be stored.
   * @param key - The key under which to store the value.
   * @param value - The value to store.
   * @param options - Optional settings for TTL and compression.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * storage.set('user', { name: 'John', age: 30 }, { ttl: 3600000, compress: true });
   * ```
   */
  set<T>(key: string, value: T, options: StorageOptions = {}): void {
    try {
      const oldValue = this.get(key);
      const item: StorageItem<T> = {
        value,
        timestamp: Date.now(),
        ttl: options.ttl,
        compressed: options.compress,
      };

      let storageValue = JSON.stringify(item);

      if (options.compress && storageValue.length > 1024) {
        try {
          storageValue = compress(storageValue);
        } catch (compressionError) {
          console.warn(
            "[LocalStorage] Compression failed, storing uncompressed:",
            compressionError,
          );
        }
      }

      this.storage.setItem(this.prefix + key, storageValue);
      this.notifyListeners(key, value, oldValue);
    } catch (error) {
      console.error("[LocalStorage] Error saving item:", error);
    }
  }

  /**
   * Retrieves a value from localStorage, checking for expiration and decompressing if necessary.
   *
   * @template T - The type of the value to be retrieved.
   * @param key - The key from which to retrieve the value.
   * @returns The stored value if it exists and hasn't expired, otherwise null.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * const user = storage.get('user');
   * console.log(user); // { name: 'John', age: 30 } or null
   * ```
   */
  get<T>(key: string): T | null {
    try {
      const storageValue = this.storage.getItem(this.prefix + key);

      if (!storageValue) return null;

      let itemStr = storageValue;
      let item: StorageItem<T>;

      try {
        const decompressedValue = decompress(storageValue);
        itemStr = decompressedValue || storageValue;
      } catch (decompressError) {
        console.warn(
          "[LocalStorage] Decompression failed, using original value:",
          decompressError,
        );
      }

      try {
        item = JSON.parse(itemStr);
      } catch (parseError) {
        console.error("[LocalStorage] Invalid JSON:", parseError);
        return null;
      }

      if (item.ttl && Date.now() - item.timestamp > item.ttl) {
        this.remove(key);
        return null;
      }

      return item.value;
    } catch (error) {
      console.error("[LocalStorage] Error retrieving item:", error);
      return null;
    }
  }

  /**
   * Removes an item from localStorage.
   *
   * @param key - The key of the item to remove.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * storage.remove('user');
   * ```
   */
  remove(key: string): void {
    try {
      const storageKey = this.prefix + key;
      const storageValue = this.storage.getItem(storageKey);
      let oldValue = null;

      if (storageValue) {
        let itemStr = storageValue;
        try {
          const decompressedValue = decompress(storageValue);
          itemStr = decompressedValue || storageValue;
        } catch {}

        try {
          const item = JSON.parse(itemStr);
          oldValue = item.value;
        } catch {}
      }

      this.storage.removeItem(storageKey);
      this.notifyListeners(key, null, oldValue);
    } catch (error) {
      console.error("[LocalStorage] Error removing item:", error);
    }
  }

  /**
   * Clears all items from localStorage that match the current prefix.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * storage.clear();
   * ```
   */
  clear(): void {
    try {
      Object.keys(this.storage)
        .filter((key) => key.startsWith(this.prefix))
        .forEach((key) => {
          const pureKey = key.replace(this.prefix, "");
          this.remove(pureKey);
        });
    } catch (error) {
      console.error("[LocalStorage] Error clearing items:", error);
    }
  }

  /**
   * Subscribes to changes for a specific key in localStorage.
   *
   * @param key - The key to listen for changes.
   * @param listener - The function to call when the key changes.
   * @returns A function to unsubscribe the listener.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * const unsubscribe = storage.subscribe('user', (key, newValue, oldValue) => {
   *   console.log(`User data changed from ${oldValue} to ${newValue}`);
   * });
   * // Later, to unsubscribe
   * unsubscribe();
   * ```
   */
  subscribe(key: string, listener: StorageEventListener): () => void {
    if (!this.listeners.has(key)) {
      this.listeners.set(key, new Set());
    }

    this.listeners.get(key)!.add(listener);

    return () => {
      const keyListeners = this.listeners.get(key);
      if (keyListeners) {
        keyListeners.delete(listener);
        if (keyListeners.size === 0) {
          this.listeners.delete(key);
        }
      }
    };
  }

  /**
   * Notifies all listeners of a key about changes.
   *
   * @param key - The key that changed.
   * @param newValue - The new value of the key.
   * @param oldValue - The old value of the key.
   *
   * @private
   */
  private notifyListeners(key: string, newValue: any, oldValue: any): void {
    const keyListeners = this.listeners.get(key);
    if (keyListeners) {
      keyListeners.forEach((listener) => {
        try {
          listener(key, newValue, oldValue);
        } catch (error) {
          console.error("[LocalStorage] Error notifying listener:", error);
        }
      });
    }
  }

  /**
   * Checks if an item exists in localStorage and hasn't expired.
   *
   * @param key - The key to check.
   * @returns True if the item exists and hasn't expired, false otherwise.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * if (storage.has('user')) {
   *   console.log('User data exists and is not expired');
   * }
   * ```
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Calculates the approximate size in bytes of an item in localStorage.
   *
   * @param key - The key of the item to measure.
   * @returns The size of the item in bytes, or 0 if the item does not exist.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * const size = storage.getSize('user');
   * console.log(`User data size: ${size} bytes`);
   * ```
   */
  getSize(key: string): number {
    try {
      const item = this.storage.getItem(this.prefix + key);
      return item ? new Blob([item]).size : 0;
    } catch (error) {
      console.error("[LocalStorage] Error calculating size:", error);
      return 0;
    }
  }

  /**
   * Calculates the remaining time in milliseconds before an item expires.
   *
   * @param key - The key of the item to check.
   * @returns The remaining time in milliseconds before expiration, or null if the item does not exist or has no TTL.
   *
   * @example
   * ```typescript
   * const storage = new LocalStorage();
   * const ttl = storage.getTTL('user');
   * if (ttl !== null) {
   *   console.log(`User data will expire in ${ttl} milliseconds`);
   * }
   * ```
   */
  getTTL(key: string): number | null {
    try {
      const storageValue = this.storage.getItem(this.prefix + key);

      if (!storageValue) return null;

      let itemStr = storageValue;
      try {
        itemStr = decompress(storageValue) || storageValue;
      } catch (decompressError) {
        console.warn(
          "[LocalStorage] TTL decompression failed:",
          decompressError,
        );
      }

      const item: StorageItem<any> = JSON.parse(itemStr);

      if (!item.ttl) return null;

      const elapsed = Date.now() - item.timestamp;
      return Math.max(0, item.ttl - elapsed);
    } catch (error) {
      console.error("[LocalStorage] Error getting TTL:", error);
      return null;
    }
  }
}
