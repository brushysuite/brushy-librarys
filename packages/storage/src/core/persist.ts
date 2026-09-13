import LZString from "lz-string";
import type { SetOptions, StorageEnvelope, SyncPersist } from "./types";
import { StorageError } from "./types";

const COMPRESS_THRESHOLD = 1024;

export function createMemoryPersist(): SyncPersist {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    keys: () => Array.from(store.keys()),
  };
}

export function createLocalPersist(): SyncPersist | null {
  if (typeof globalThis.localStorage === "undefined") {
    return null;
  }
  const storage = globalThis.localStorage;
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    keys: () => {
      const result: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          result.push(key);
        }
      }
      return result;
    },
  };
}

export function createSessionPersist(): SyncPersist | null {
  if (typeof globalThis.sessionStorage === "undefined") {
    return null;
  }
  const storage = globalThis.sessionStorage;
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => storage.setItem(key, value),
    removeItem: (key) => storage.removeItem(key),
    keys: () => {
      const result: string[] = [];
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key) {
          result.push(key);
        }
      }
      return result;
    },
  };
}

export function resolvePersist(option: import("./types").PersistOption): SyncPersist | null {
  if (option === false) {
    return null;
  }
  if (option === "local") {
    return createLocalPersist();
  }
  if (option === "session") {
    return createSessionPersist();
  }
  return option;
}

export function serializeEnvelope<T>(
  value: T,
  ttlSeconds: number,
  compressPayload: boolean,
): string {
  const envelope: StorageEnvelope<T> = {
    v: 1,
    value,
    ts: Date.now(),
    ttl: ttlSeconds > 0 ? ttlSeconds : undefined,
  };

  let raw = JSON.stringify(envelope);

  if (compressPayload && raw.length > COMPRESS_THRESHOLD) {
    const compressed = LZString.compress(raw);
    const compressedEnvelope: StorageEnvelope<string> = {
      v: 1,
      value: compressed,
      ts: envelope.ts,
      ttl: envelope.ttl,
      c: 1,
    };
    raw = JSON.stringify(compressedEnvelope);
  }

  return raw;
}

export function deserializeEnvelope<T>(raw: string): { value: T; expired: boolean } | null {
  try {
    let parsed = JSON.parse(raw) as StorageEnvelope<unknown>;

    if (parsed.c === 1 && typeof parsed.value === "string") {
      const decompressed = LZString.decompress(parsed.value);
      if (!decompressed) {
        return null;
      }
      parsed = JSON.parse(decompressed) as StorageEnvelope<T>;
    }

    if (parsed.v !== 1) {
      return null;
    }

    const expired =
      parsed.ttl !== undefined &&
      parsed.ttl > 0 &&
      Date.now() - parsed.ts > parsed.ttl * 1000;

    return { value: parsed.value as T, expired };
  } catch {
    return null;
  }
}

export function persistSet<T>(
  persist: SyncPersist,
  prefixedKey: string,
  value: T,
  ttlSeconds: number,
  options: SetOptions & { compress?: boolean },
  onError?: (error: StorageError) => void,
): void {
  try {
    const raw = serializeEnvelope(value, ttlSeconds, options.compress ?? false);
    persist.setItem(prefixedKey, raw);
  } catch (error) {
    const storageError =
      error instanceof DOMException && error.name === "QuotaExceededError"
        ? new StorageError("Persist quota exceeded", "QuotaExceeded")
        : new StorageError("Failed to serialize persist value", "Serialize");
    onError?.(storageError);
    throw storageError;
  }
}

export function persistGet<T>(persist: SyncPersist, prefixedKey: string): T | undefined {
  const raw = persist.getItem(prefixedKey);
  if (!raw) {
    return undefined;
  }
  const result = deserializeEnvelope<T>(raw);
  if (!result || result.expired) {
    persist.removeItem(prefixedKey);
    return undefined;
  }
  return result.value;
}

export function persistRemove(persist: SyncPersist, prefixedKey: string): void {
  persist.removeItem(prefixedKey);
}
