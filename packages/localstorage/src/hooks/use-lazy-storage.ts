import { useState, useCallback, useRef } from "react";
import { LazyStorage, LazyStorageOptions } from "../lib/lazy-storage";
import type { CompressionOptions } from "../core/types";

/**
 * A React hook for managing lazy-loaded data in localStorage with support for compression and field-specific operations.
 * 
 * @template T - The type of data to be stored, which must be an object.
 * @param key - The unique key to store the data in localStorage.
 * @param initialValue - The initial value to use if no data is stored.
 * @param options - Additional storage options, such as compression.
 * @returns An object containing the current value, functions to update the value, preload fields, check if fields are loaded, and remove the data.
 * 
 * @example
 * ```tsx
 * import { useLazyStorage } from "@brushy/localstorage;
 * 
 * interface UserData {
 *   name: string;
 *   email: string;
 *   address?: {
 *     street: string;
 *     city: string;
 *   };
 * }
 * 
 * function UserProfile() {
 *   const [userData, setUserData, preloadField, isFieldLoaded, removeUserData] = useLazyStorage<UserData>(
 *     "user:profile",
 *     { name: "", email: "" }
 *   );
 * 
 *   const handleLoadAddress = () => {
 *     if (!isFieldLoaded("address")) {
 *       preloadField("address");
 *     }
 *   };
 * 
 *   return (
 *     <div>
 *       <h2>{userData.name}</h2>
 *       <p>{userData.email}</p>
 *       {isFieldLoaded("address") ? (
 *         <div>
 *           <p>{userData.address?.street}</p>
 *           <p>{userData.address?.city}</p>
 *         </div>
 *       ) : (
 *         <button onClick={handleLoadAddress}>Load Address</button>
 *       )}
 *       <button onClick={() => removeUserData()}>Remove Profile</button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useLazyStorage<T extends object>(
  key: string,
  initialValue: T,
  options: LazyStorageOptions = {},
) {
  const storage = new LazyStorage();

  /**
   * Initial state of the stored value or the provided initial value.
   */
  const [value, setValue] = useState<T>(() => {
    const stored = storage.getLazy<T>(key, options);
    return stored !== null ? stored : initialValue;
  });

  /**
   * Keeps track of which fields have been loaded.
   */
  const loadedFields = useRef(new Set<string>());

  /**
   * Updates the value stored in localStorage.
   * 
   * @param newValue - The new value or a function that returns the new value based on the previous value.
   */
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev) => {
        const resolvedValue =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;

        const defaultCompression: CompressionOptions = {
          mode: undefined,
          threshold: 1024,
        };

        storage.setLazy(key, resolvedValue, {
          ...options,
          compression: options.compression ?? defaultCompression,
        });

        // Mark all fields as loaded
        Object.keys(resolvedValue).forEach((field) => {
          const typedField = field as keyof T;
          if (resolvedValue[typedField] !== undefined) {
            loadedFields.current.add(field);
          }
        });

        return resolvedValue;
      });
    },
    [key, options],
  );

  /**
   * Preloads a specific field from the stored data.
   * 
   * @param field - The field to preload.
   */
  const preloadField = useCallback(
    (field: string) => {
      if (!loadedFields.current.has(field)) {
        storage.preload(key, [field]);
        loadedFields.current.add(field);
      }
    },
    [key],
  );

  /**
   * Checks if a specific field has been loaded.
   * 
   * @param field - The field to check.
   * @returns True if the field has been loaded, false otherwise.
   */
  const isFieldLoaded = useCallback(
    (field: string) => loadedFields.current.has(field),
    [],
  );

  /**
   * Removes the stored data and resets to the initial value.
   */
  const remove = useCallback(() => {
    storage.remove(key);
    setValue(initialValue);
    loadedFields.current.clear();
  }, [key, initialValue]);

  return {
    value,
    setValue: updateValue,
    preloadField,
    isFieldLoaded,
    remove,
  } as const;
}
