import { useState, useCallback } from "react";
import { LocalStorage } from "../lib/localstorage";
import type { StorageOptions } from "../core/types";

/**
 * Hook for managing data in localStorage with support for compression and field updates.
 *
 * @template T - The type of data to be stored.
 * @param key - The unique key to store the data in localStorage.
 * @param initialValue - The initial value to use if no data is stored.
 * @param options - Additional storage options, such as compression.
 * @returns An object containing the current value, functions to update the value, and remove the data.
 *
 * @example
 * ```tsx
 * import { useStorage } from "@brushy/localstorage";
 *
 * function AuthComponent() {
 *   const [token, setToken, removeToken] = useStorage("auth:token", null);
 *
 *   const handleLogin = async (credentials) => {
 *     const response = await api.login(credentials);
 *     setToken(response.token);
 *   };
 *
 *   const handleLogout = () => {
 *     removeToken();
 *   };
 *
 *   return (
 *     <div>
 *       {token ? (
 *         <>
 *           <p>Authenticated with token: {token}</p>
 *           <button onClick={handleLogout}>Logout</button>
 *         </>
 *       ) : (
 *         <LoginForm onSubmit={handleLogin} />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
export function useStorage<T>(
  key: string,
  initialValue: T,
  options: StorageOptions = {},
) {
  const storage = new LocalStorage();

  /**
   * Initial state of the stored value or the provided initial value.
   */
  const [value, setValue] = useState<T>(() => {
    const stored = storage.get<T>(key);
    return stored !== null ? stored : initialValue;
  });

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

        storage.set(key, resolvedValue, {
          ...options,
          compress:
            options.compress ??
            (resolvedValue && JSON.stringify(resolvedValue).length > 1024),
        });
        return resolvedValue;
      });
    },
    [key, options],
  );

  /**
   * Updates specific fields of the stored value.
   *
   * @param updates - An object containing the fields to be updated.
   */
  const updateFields = useCallback(
    (updates: Partial<T>) => {
      setValue((prev) => {
        const updatedValue = { ...prev, ...updates };
        storage.set(key, updatedValue, {
          ...options,
          compress:
            options.compress ??
            (updatedValue && JSON.stringify(updatedValue).length > 1024),
        });
        return updatedValue;
      });
    },
    [key, options],
  );

  /**
   * Removes the stored data and resets to the initial value.
   */
  const remove = useCallback(() => {
    storage.remove(key);
    setValue(initialValue);
  }, [key, initialValue]);

  return {
    value,
    setValue: updateValue,
    updateFields,
    remove,
  } as const;
}
