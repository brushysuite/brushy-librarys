import type { SetOptions, StorageKey } from "@brushy/storage";
import { useCallback, useSyncExternalStore } from "react";
import { useStorageContext } from "./context";

export interface UseStorageResult<T> {
  value: T;
  set: (next: T | ((prev: T) => T), options?: SetOptions) => void;
  remove: () => void;
}

export function useStorage<T>(
  key: StorageKey,
  initialValue: T,
  options?: SetOptions,
): UseStorageResult<T> {
  const storage = useStorageContext();

  const subscribe = useCallback(
    (onStoreChange: () => void) => storage.subscribe(key, onStoreChange),
    [storage, key],
  );

  const getSnapshot = useCallback(
    () => storage.getSnapshot(key, initialValue),
    [storage, key, initialValue],
  );

  const getServerSnapshot = useCallback(() => initialValue, [initialValue]);

  const value = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const set = useCallback(
    (next: T | ((prev: T) => T), setOptions?: SetOptions) => {
      const ttl = setOptions?.ttl ?? options?.ttl;
      if (typeof next === "function") {
        const prev = storage.get<T>(key) ?? initialValue;
        storage.set(key, (next as (prev: T) => T)(prev), ttl);
        return;
      }
      storage.set(key, next, ttl);
    },
    [storage, key, initialValue, options?.ttl],
  );

  const remove = useCallback(() => {
    storage.del(key);
  }, [storage, key]);

  return { value, set, remove };
}
