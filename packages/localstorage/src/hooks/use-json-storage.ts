import { useState, useCallback } from "react";
import { JSONStorage } from "../lib/json-storage";
import { JSONStorageOptions } from "../core/types";

/**
 * A React hook for managing JSON data in localStorage with support for partial updates, schema validation, and array merging.
 * 
 * @template T - The type of JSON data to be stored, which must be an object.
 * @param key - The unique key to store the data in localStorage.
 * @param initialValue - The initial value to use if no data is stored.
 * @param options - Additional storage options, such as compression or a custom reviver.
 * @returns An object containing the current value, functions to update the value, merge arrays, and remove the data, along with validation and schema information.
 * 
 * @example
 * ```tsx
 * import { useJSONStorage } from "@brushy/localstorage";
 * 
 * interface UserPreferences {
 *   theme: "light" | "dark";
 *   fontSize: number;
 *   notifications: {
 *     email: boolean;
 *     push: boolean;
 *   };
 * }
 * 
 * function SettingsComponent() {
 *   const [prefs, setPrefs, updatePrefs, mergePrefs, removePrefs, isValid, schema] = useJSONStorage<UserPreferences>(
 *     "user:prefs",
 *     {
 *       theme: "light",
 *       fontSize: 14,
 *       notifications: {
 *         email: true,
 *         push: true,
 *       },
 *     },
 *   );
 * 
 *   const toggleTheme = () => {
 *     updatePrefs({ theme: prefs.theme === "light" ? "dark" : "light" });
 *   };
 * 
 *   const increaseFontSize = () => {
 *     updatePrefs({ fontSize: prefs.fontSize + 2 });
 *   };
 * 
 *   const disableNotifications = () => {
 *     updatePrefs({
 *       notifications: {
 *         email: false,
 *         push: false,
 *       },
 *     });
 *   };
 * 
 *   const addNotificationTypes = () => {
 *     mergePrefs(["sms", "in-app"], { unique: true });
 *   };
 * 
 *   return (
 *     <div>
 *       <h1>Settings</h1>
 *       <p>Current Theme: {prefs.theme}</p>
 *       <p>Font Size: {prefs.fontSize}</p>
 *       <p>Notifications: {prefs.notifications.email ? "Email" : ""} {prefs.notifications.push ? "Push" : ""}</p>
 *       <button onClick={toggleTheme}>Toggle Theme</button>
 *       <button onClick={increaseFontSize}>Increase Font Size</button>
 *       <button onClick={disableNotifications}>Disable Notifications</button>
 *       <button onClick={addNotificationTypes}>Add Notification Types</button>
 *       <button onClick={removePrefs}>Reset Settings</button>
 *       <p>Is Valid: {isValid ? "Yes" : "No"}</p>
 *       <p>Schema: {schema ? JSON.stringify(schema) : "None"}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useJSONStorage<T extends object>(
  key: string,
  initialValue: T,
  options: JSONStorageOptions = {},
) {
  const storage = new JSONStorage();

  /**
   * The current value stored in localStorage or the initial value if no data is stored.
   */
  const [value, setValue] = useState<T>(() => {
    const stored = storage.getJSON<T>(key, { reviver: options.reviver });
    return stored !== null ? stored : initialValue;
  });

  /**
   * Indicates whether the stored JSON data is valid.
   */
  const [isValid, setIsValid] = useState(() => {
    try {
      const stored = storage.getJSON<T>(key);
      return stored !== null;
    } catch {
      return false;
    }
  });

  /**
   * The JSON schema of the stored data, if available.
   */
  const [schema, setSchema] = useState(() => {
    try {
      const stored = storage.getJSON<T>(key);
      return stored ? storage.getJSONSchema(key) : null;
    } catch {
      return null;
    }
  });

  /**
   * Updates the entire value stored in localStorage.
   * 
   * @param newValue - The new value or a function that returns the new value based on the previous value.
   */
  const updateValue = useCallback(
    (newValue: T | ((prev: T) => T)) => {
      setValue((prev: T) => {
        const resolvedValue =
          typeof newValue === "function"
            ? (newValue as (prev: T) => T)(prev)
            : newValue;

        storage.setJSON(key, resolvedValue, options);
        setIsValid(storage.isValidJSON(key));
        setSchema(storage.getJSONSchema(key));
        return resolvedValue;
      });
    },
    [key, options],
  );

  /**
   * Updates specific fields of the stored JSON data.
   * 
   * @param updates - An object containing the fields to be updated.
   */
  const updateFields = useCallback(
    (updates: Partial<T>) => {
      const updated = storage.updateJSON<T>(key, updates, options);
      if (updated) {
        setValue(updated);
        setIsValid(storage.isValidJSON(key));
        setSchema(storage.getJSONSchema(key));
      }
    },
    [key, options],
  );

  /**
   * Merges an array of items into the stored JSON data.
   * 
   * @template I - The type of items in the array to be merged.
   * @param items - The array of items to merge.
   * @param mergeOptions - Options for merging, such as ensuring uniqueness or providing a custom comparator.
   */
  const mergeArrays = useCallback(
    <I>(
      items: I[],
      mergeOptions: {
        unique?: boolean;
        comparator?: (a: I, b: I) => boolean;
      } = {},
    ) => {
      if (!Array.isArray(value)) {
        throw new Error("Current value is not an array");
      }

      const merged = storage.mergeArrays(key, items, {
        ...options,
        ...mergeOptions,
      });

      setValue(merged as unknown as T);
      setIsValid(storage.isValidJSON(key));
      setSchema(storage.getJSONSchema(key));
    },
    [key, options, value],
  );

  /**
   * Removes the stored JSON data and resets to the initial value.
   */
  const remove = useCallback(() => {
    storage.remove(key);
    setValue(initialValue);
    setIsValid(storage.isValidJSON(key));
    setSchema(storage.getJSONSchema(key));
  }, [key, initialValue]);

  return {
    value,
    setValue: updateValue,
    updateFields,
    mergeArrays,
    remove,
    isValid,
    schema,
  } as const;
}
