import { CompressionOptions, JSONStorageOptions } from "../core/types";
import { TypedCompression } from "../utils/compression";
import { JSONStorage } from "./json-storage";

/**
 * Options for configuring the LazyStorage class.
 * @extends JSONStorageOptions
 */
export interface LazyStorageOptions extends JSONStorageOptions {
  /**
   * Compression options for stored data.
   */
  compression?: CompressionOptions;
  /**
   * Size of chunks for large arrays.
   */
  chunkSize?: number;
  /**
   * Fields to be loaded lazily.
   */
  lazyFields?: string[];
  /**
   * Fields to preload when retrieving data.
   */
  preloadFields?: string[];
}

/**
 * The `LazyStorage` class extends `JSONStorage` to provide lazy loading of large fields in objects.
 * It allows efficient storage and retrieval of large datasets without overloading localStorage or memory.
 *
 * @example
 * ```typescript
 * const lazyStorage = new LazyStorage();
 * const userData = {
 *   id: 123,
 *   name: "John",
 *   email: "john@example.com",
 *   posts: Array(1000).fill().map((_, i) => ({ id: i, title: `Post ${i}`, content: `Content of post ${i}...` })),
 *   comments: Array(500).fill().map((_, i) => ({ id: i, text: `Comment ${i}` })),
 * };
 * lazyStorage.setLazy("user", userData, {
 *   lazyFields: ["posts", "comments"],
 *   chunkSize: 200,
 *   compression: { mode: "aggressive", threshold: 512 },
 * });
 * const user = lazyStorage.getLazy("user");
 * console.log(user.id); // 123
 * console.log(user.posts.length); // 1000 (loads posts on demand)
 * ```
 */
export class LazyStorage extends JSONStorage {
  /**
   * Default chunk size for large arrays.
   */
  private static readonly DEFAULT_CHUNK_SIZE = 50;
  /**
   * Cache for storing lazy-loaded fields.
   */
  private cache = new Map<string, any>();

  /**
   * Creates a new instance of `LazyStorage` with the specified prefix.
   * @param prefix - The prefix to use for all stored keys. Defaults to '@brushy/lazy:'.
   */
  constructor(prefix = "@brushy/lazy:") {
    super(prefix);
  }

  /**
   * Stores an object with support for lazy fields.
   * @param key - The key to store the value under.
   * @param value - The object to be stored.
   * @param options - Storage options.
   * @example
   * ```typescript
   * const userData = {
   *   id: 123,
   *   name: "John",
   *   posts: Array(1000).fill().map((_, i) => ({ id: i, title: `Post ${i}`, content: `Content of post ${i}...` })),
   * };
   * lazyStorage.setLazy("user", userData, {
   *   lazyFields: ["posts"],
   *   chunkSize: 200,
   *   compression: { mode: "auto", threshold: 1024 },
   * });
   * ```
   */
  setLazy<T extends object>(
    key: string,
    value: T,
    options: LazyStorageOptions = {},
  ): void {
    const {
      lazyFields = [],
      chunkSize = LazyStorage.DEFAULT_CHUNK_SIZE,
      compression,
      ...jsonOptions
    } = options;
    const processedValue = this.processLazyFields(
      key,
      value,
      lazyFields,
      chunkSize,
    );
    const compressedValue = compression
      ? TypedCompression.compressData(processedValue, compression)
      : JSON.stringify(processedValue);
    super.set(key, compressedValue, jsonOptions);
  }

  /**
   * Retrieves an object with lazy loading support.
   * @param key - The key of the object to retrieve.
   * @param options - Retrieval options.
   * @returns The stored object with lazy loading support, or `null` if the key doesn't exist or an error occurs.
   * @example
   * ```typescript
   * const user = lazyStorage.getLazy("user");
   * console.log(user.id); // 123
   * console.log(user.posts.length); // 1000 (loads posts on demand)
   * ```
   */
  getLazy<T extends object>(
    key: string,
    options: LazyStorageOptions = {},
  ): T | null {
    try {
      const value = super.get<string>(key);
      if (!value) return null;

      const data = TypedCompression.decompressData(value) || JSON.parse(value);
      if (!data) return null;

      if (options.preloadFields?.length) {
        options.preloadFields.forEach((field) =>
          this.loadLazyField(key, field),
        );
      }

      return this.createLazyProxy(key, data);
    } catch (error) {
      console.error("[LazyStorage] Error getting lazy value:", error);
      return null;
    }
  }

  /**
   * Processes lazy fields in the given object.
   * @param parentKey - The parent key for the object.
   * @param value - The object to process.
   * @param lazyFields - Fields to be processed lazily.
   * @param chunkSize - Size of chunks for large arrays.
   * @returns The processed object with lazy fields marked.
   */
  private processLazyFields<T extends object>(
    parentKey: string,
    value: T,
    lazyFields: string[],
    chunkSize: number,
  ): any {
    const processed = { ...value } as Record<string, any>;

    for (const field of lazyFields) {
      const fieldValue = value[field as keyof T];
      if (fieldValue === undefined) continue;

      if (Array.isArray(fieldValue)) {
        const chunks = this.chunkArray(fieldValue, chunkSize);
        const chunkKeys = chunks.map((chunk, index) => {
          const chunkKey = `${parentKey}:${field}:${index}`;
          this.setJSON(chunkKey, chunk, {});
          return chunkKey;
        });

        processed[field] = {
          __lazy: true,
          type: "array",
          chunks: chunkKeys,
          total: fieldValue.length,
        };
      } else if (typeof fieldValue === "object" && fieldValue !== null) {
        const fieldKey = `${parentKey}:${field}`;
        this.setJSON(fieldKey, fieldValue, {});
        processed[field] = { __lazy: true, type: "object", key: fieldKey };
      }
    }

    return processed;
  }

  /**
   * Creates a proxy for lazy loading of fields.
   * @param key - The key of the object.
   * @param data - The data to create a proxy for.
   * @returns A proxy object that intercepts property access for lazy loading.
   */
  private createLazyProxy<T extends object>(key: string, data: T): T {
    return new Proxy(data, {
      get: (target: T, prop: string | symbol) => {
        if (
          typeof prop === "string" &&
          (target as Record<string, { __lazy?: boolean }>)[prop]?.__lazy
        ) {
          if (!this.cache.has(`${key}:${prop}`)) {
            const value = this.loadLazyField(key, prop);
            this.cache.set(`${key}:${prop}`, value);
          }
          return this.cache.get(`${key}:${prop}`);
        }
        return Reflect.get(target, prop);
      },
    }) as T;
  }

  /**
   * Loads a lazy field from storage.
   * @param parentKey - The parent key of the object.
   * @param field - The field to load.
   * @returns The loaded value or `undefined` if the field is not lazy or does not exist.
   */
  private loadLazyField(parentKey: string, field: string) {
    const data = super.getJSON<Record<string, any>>(parentKey);
    if (!data || !data[field]?.__lazy) return undefined;

    const lazyData = data[field];

    if (lazyData.type === "array") {
      return lazyData.chunks
        .map((chunkKey: string) => this.getJSON(chunkKey) || [])
        .flat();
    } else if (lazyData.type === "object") {
      return this.getJSON(lazyData.key);
    }

    return undefined;
  }

  /**
   * Chunks an array into smaller arrays of the specified size.
   * @param array - The array to chunk.
   * @param size - The size of each chunk.
   * @returns An array of chunks.
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    return Array.from({ length: Math.ceil(array.length / size) }, (_, i) =>
      array.slice(i * size, (i + 1) * size),
    );
  }

  /**
   * Preloads specific lazy fields.
   * @param key - The key of the object.
   * @param fields - Fields to preload.
   * @example
   * ```typescript
   * lazyStorage.preload("user", ["posts"]);
   * ```
   */
  preload(key: string, fields: string[]): void {
    fields.forEach((field) => {
      const value = this.loadLazyField(key, field);
      if (value !== undefined) {
        this.cache.set(`${key}:${field}`, value);
      }
    });
  }

  /**
   * Clears the internal cache of lazy fields.
   * @example
   * ```typescript
   * lazyStorage.clearCache();
   * ```
   */
  clearCache(): void {
    this.cache.clear();
  }
}
