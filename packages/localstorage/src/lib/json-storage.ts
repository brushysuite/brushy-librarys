import { LocalStorage } from "./localstorage";
import type { JSONStorageOptions } from "../core/types";

/**
 * The `JSONStorage` class extends `LocalStorage` to provide JSON-specific operations.
 * It offers methods for storing, retrieving, updating, and validating JSON data in localStorage.
 *
 * @example
 * ```typescript
 * const jsonStorage = new JSONStorage();
 * jsonStorage.setJSON('user', { name: 'John', age: 30 });
 * const user = jsonStorage.getJSON<{ name: string; age: number }>('user');
 * console.log(user); // { name: 'John', age: 30 }
 * ```
 */
export class JSONStorage extends LocalStorage {
  /**
   * Creates a new instance of `JSONStorage` with an optional prefix.
   * @param prefix - The prefix to use for all stored keys. Defaults to '@brushy/json:'.
   */
  constructor(prefix = "@brushy/json:") {
    super(prefix);
  }

  /**
   * Stores a JSON value in localStorage.
   * @param key - The key to store the value under.
   * @param value - The JSON value to be stored.
   * @param options - Options for JSON serialization and storage.
   * @throws Error if JSON serialization fails.
   *
   * @example
   * ```typescript
   * const jsonStorage = new JSONStorage();
   * jsonStorage.setJSON('user', { name: 'John', age: 30 }, { pretty: true });
   * ```
   */
  setJSON<T extends object>(
    key: string,
    value: T,
    options: JSONStorageOptions = {},
  ): void {
    try {
      const { pretty, replacer, ...storageOptions } = options;
      const jsonString = JSON.stringify(
        value,
        replacer,
        pretty ? 2 : undefined,
      );
      super.set(key, jsonString, storageOptions);
    } catch (error) {
      console.error("[JSONStorage] Error serializing JSON:", error);
      throw new Error("Failed to serialize JSON data");
    }
  }

  /**
   * Retrieves a JSON value from localStorage.
   * @param key - The key to retrieve the value from.
   * @param options - Options for JSON parsing.
   * @returns The parsed JSON value or null if the key does not exist or parsing fails.
   *
   * @example
   * ```typescript
   * const jsonStorage = new JSONStorage();
   * const user = jsonStorage.getJSON<{ name: string; age: number }>('user');
   * console.log(user); // { name: 'John', age: 30 } or null
   * ```
   */
  getJSON<T extends object>(
    key: string,
    { reviver }: Pick<JSONStorageOptions, "reviver"> = {},
  ): T | null {
    try {
      const value = super.get<string>(key);
      return value ? (JSON.parse(value, reviver) as T) : null;
    } catch (error) {
      console.error("[JSONStorage] Error parsing JSON:", error);
      return null;
    }
  }

  /**
   * Updates a JSON value in localStorage with partial updates.
   * @param key - The key to update the value for.
   * @param updates - The partial updates to apply to the existing JSON value.
   * @param options - Options for JSON parsing and storage.
   * @returns The updated JSON value or null if the key does not exist or updating fails.
   *
   * @example
   * ```typescript
   * const jsonStorage = new JSONStorage();
   * jsonStorage.setJSON('user', { name: 'John', age: 30 });
   * const updatedUser = jsonStorage.updateJSON('user', { age: 31 });
   * console.log(updatedUser); // { name: 'John', age: 31 }
   * ```
   */
  updateJSON<T extends object>(
    key: string,
    updates: Partial<T>,
    options: JSONStorageOptions = {},
  ): T | null {
    try {
      const currentValue = this.getJSON<T>(key, { reviver: options.reviver });
      if (!currentValue) return null;

      const updatedValue = { ...currentValue, ...updates };
      this.setJSON(key, updatedValue, options);
      return updatedValue;
    } catch (error) {
      console.error("[JSONStorage] Error updating JSON:", error);
      return null;
    }
  }

  /**
   * Merges new items into an existing array stored in localStorage.
   * @param key - The key to merge the new items into.
   * @param newItems - The new items to merge into the existing array.
   * @param options - Options for JSON parsing, storage, and merging.
   * @returns The merged array or an empty array if merging fails.
   *
   * @example
   * ```typescript
   * const jsonStorage = new JSONStorage();
   * jsonStorage.setJSON('fruits', ['apple', 'banana']);
   * const mergedFruits = jsonStorage.mergeArrays('fruits', ['orange'], { unique: true });
   * console.log(mergedFruits); // ['apple', 'banana', 'orange']
   * ```
   */
  mergeArrays<T>(
    key: string,
    newItems: T[],
    options: JSONStorageOptions & {
      unique?: boolean;
      comparator?: (a: T, b: T) => boolean;
    } = {},
  ): T[] {
    try {
      const currentArray =
        this.getJSON<T[]>(key, { reviver: options.reviver }) || [];
      let mergedArray = [...currentArray, ...newItems];

      if (options.unique) {
        mergedArray = options.comparator
          ? mergedArray.filter(
              (item, index, self) =>
                index ===
                self.findIndex((other) => options.comparator!(item, other)),
            )
          : Array.from(new Set(mergedArray));
      }

      this.setJSON(key, mergedArray, options);
      return mergedArray;
    } catch (error) {
      console.error("[JSONStorage] Error merging arrays:", error);
      return [];
    }
  }

  /**
   * Checks if the value stored under the given key is valid JSON.
   * @param key - The key to check for valid JSON.
   * @returns True if the value is valid JSON, false otherwise.
   *
   * @example
   * ```typescript
   * const jsonStorage = new JSONStorage();
   * jsonStorage.setJSON('user', { name: 'John', age: 30 });
   * console.log(jsonStorage.isValidJSON('user')); // true
   * ```
   */
  isValidJSON(key: string): boolean {
    try {
      const value = super.get<string>(key);
      if (!value) return false;
      JSON.parse(value);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves the JSON schema of the value stored under the given key.
   * @param key - The key to retrieve the schema for.
   * @returns The JSON schema of the stored value or null if the key does not exist or schema generation fails.
   *
   * @example
   * ```typescript
   * const jsonStorage = new JSONStorage();
   * jsonStorage.setJSON('user', { name: 'John', age: 30 });
   * const schema = jsonStorage.getJSONSchema('user');
   * console.log(schema); // { type: 'object', properties: { name: { type: 'string' }, age: { type: 'number' } } }
   * ```
   */
  getJSONSchema(key: string): object | null {
    try {
      const value = this.getJSON(key);
      if (!value) return null;

      const getType = (val: any): string =>
        Array.isArray(val) ? "array" : val === null ? "null" : typeof val;

      const buildSchema = (obj: any): object => {
        if (typeof obj !== "object" || obj === null)
          return { type: getType(obj) };

        const schema: Record<string, any> = Array.isArray(obj)
          ? {
              type: "array",
              items: obj.length > 0 ? buildSchema(obj[0]) : undefined,
            }
          : {
              type: "object",
              properties: Object.fromEntries(
                Object.entries(obj).map(([k, v]) => [k, buildSchema(v)]),
              ),
            };

        return schema;
      };

      return buildSchema(value);
    } catch (error) {
      console.error("[JSONStorage] Error getting JSON schema:", error);
      return null;
    }
  }
}
