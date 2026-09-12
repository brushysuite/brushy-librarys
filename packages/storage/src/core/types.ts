export type StorageKey = string | number;

export type StorageEventType = "set" | "del" | "flush" | "expired";

export interface CacheEvent {
  type: StorageEventType;
  key?: string;
  version: number;
  source?: string;
}

export interface CacheBus {
  publish(event: CacheEvent): void;
  subscribe(handler: (event: CacheEvent) => void): () => void;
}

export interface SyncPersist {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  keys(): string[];
}

export type PersistOption = "local" | "session" | SyncPersist | false;

export interface StorageOptions {
  /** Unique id for registry — instances with the same id share in-process sync */
  id?: string;
  /** Key prefix for persist layer */
  prefix?: string;
  /** Default TTL in seconds (0 = unlimited) */
  stdTTL?: number | string;
  /** Interval in seconds to scan for expired keys (0 = disabled) */
  checkperiod?: number;
  /** Deep-clone values on get/set via structuredClone */
  useClones?: boolean;
  /** Remove keys when they expire */
  deleteOnExpire?: boolean;
  /** Max keys (-1 = unlimited) */
  maxKeys?: number;
  /** Write-through persist adapter */
  persist?: PersistOption;
  /** Cross-runtime invalidation bus */
  bus?: CacheBus;
  /** Compress large persist payloads */
  compress?: boolean;
  /** Error handler */
  onError?: (error: StorageError) => void;
}

export interface SetOptions {
  ttl?: number | string;
  compress?: boolean;
}

export interface StorageEnvelope<T = unknown> {
  v: 1;
  value: T;
  ts: number;
  /** TTL in seconds from ts */
  ttl?: number;
  /** 1 = lz-string compressed value field */
  c?: 1;
}

export type StorageEventName = "set" | "del" | "expired" | "flush";

export type StorageEventListener<T = unknown> = (key: string, value: T | undefined) => void;

export interface Storage<TValue = unknown> {
  set(key: StorageKey, value: TValue, ttl?: number | string): boolean;
  get<T = TValue>(key: StorageKey): T | undefined;
  del(key: StorageKey | StorageKey[]): number;
  has(key: StorageKey): boolean;
  ttl(key: StorageKey, ttl?: number | string): boolean;
  getTtl(key: StorageKey): number | undefined;
  take<T = TValue>(key: StorageKey): T | undefined;
  keys(): string[];
  flushAll(): void;
  on(event: StorageEventName, listener: StorageEventListener): void;
  off(event: StorageEventName, listener: StorageEventListener): void;
  close(): void;
  /** Stable snapshot for useSyncExternalStore */
  getSnapshot<T = TValue>(key: StorageKey, fallback: T): T;
  subscribe(key: StorageKey, listener: () => void): () => void;
  subscribeAll(listener: () => void): () => void;
}

export class StorageError extends Error {
  constructor(
    message: string,
    readonly code: "QuotaExceeded" | "Serialize" | "Unavailable" | "MaxKeys",
  ) {
    super(message);
    this.name = "StorageError";
  }
}
