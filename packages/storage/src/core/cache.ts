import { composeBuses, createBroadcastBus, getRegistryChannel } from "./bus";
import {
  persistGet,
  persistRemove,
  persistSet,
  resolvePersist,
} from "./persist";
import { expireAtFromTtlSeconds, parseTtlToSeconds } from "./ttl";
import type {
  CacheEvent,
  SetOptions,
  Storage,
  StorageEventListener,
  StorageEventName,
  StorageKey,
  StorageOptions,
} from "./types";
import { StorageError } from "./types";

interface CacheEntry<T = unknown> {
  value: T;
  /** 0 = no expiry */
  expireAt: number;
}

const instances = new Map<string, BrushyStorage>();

function normalizeKey(key: StorageKey): string {
  return String(key);
}

function cloneValue<T>(value: T, useClones: boolean): T {
  if (!useClones || value === undefined) {
    return value;
  }
  if (typeof structuredClone === "function") {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value)) as T;
}

/** Node timers expose `unref()`; browser `setInterval` returns a number. */
function unrefInterval(timer: ReturnType<typeof setInterval>): void {
  if (typeof timer !== "object" || timer === null) {
    return;
  }
  const unref = (timer as { unref?: () => void }).unref;
  if (typeof unref === "function") {
    unref.call(timer);
  }
}

class BrushyStorage implements Storage {
  private readonly data = new Map<string, CacheEntry>();
  private readonly eventListeners = new Map<StorageEventName, Set<StorageEventListener>>();
  private readonly keyListeners = new Map<string, Set<() => void>>();
  private readonly globalListeners = new Set<() => void>();
  private readonly snapshots = new Map<string, unknown>();
  private readonly stdTTL: number;
  private readonly useClones: boolean;
  private readonly deleteOnExpire: boolean;
  private readonly maxKeys: number;
  private readonly prefix: string;
  private readonly persist: ReturnType<typeof resolvePersist>;
  private readonly defaultCompress: boolean;
  private readonly onError?: (error: StorageError) => void;
  private readonly bus: ReturnType<typeof composeBuses>;
  private readonly instanceId: string;
  private readonly busSource: string;
  private version = 0;
  private checkTimer: ReturnType<typeof setInterval> | null = null;
  private closed = false;
  private busUnsubscribe: (() => void) | null = null;

  constructor(options: StorageOptions = {}) {
    this.prefix = options.prefix ?? "@brushy:";
    this.stdTTL = parseTtlToSeconds(options.stdTTL, 0, { numericStringUnit: "ms" });
    this.useClones = options.useClones ?? false;
    this.deleteOnExpire = options.deleteOnExpire ?? true;
    this.maxKeys = options.maxKeys ?? -1;
    this.persist = resolvePersist(options.persist ?? false);
    this.defaultCompress = options.compress ?? false;
    this.onError = options.onError;
    this.instanceId = options.id ?? this.prefix;
    this.busSource = `${this.instanceId}:${Math.random().toString(36).slice(2)}`;

    const registryBus = getRegistryChannel(this.instanceId);
    const broadcastBus = createBroadcastBus(`@brushy/storage:${this.instanceId}`);
    this.bus = composeBuses(registryBus, broadcastBus, options.bus);

    this.busUnsubscribe = this.bus.subscribe((event) => {
      if (event.source === this.busSource) {
        return;
      }
      this.handleRemoteEvent(event);
    });

    const checkperiod = options.checkperiod ?? 600;
    if (checkperiod > 0) {
      this.checkTimer = setInterval(() => this.checkExpired(), checkperiod * 1000);
      unrefInterval(this.checkTimer);
    }

    instances.set(this.instanceId, this);
  }

  set(key: StorageKey, value: unknown, ttl?: number | string): boolean {
    if (this.closed) {
      return false;
    }

    const normalized = normalizeKey(key);

    if (this.maxKeys > 0 && !this.data.has(normalized) && this.data.size >= this.maxKeys) {
      const error = new StorageError("Cache maxKeys limit reached", "MaxKeys");
      this.onError?.(error);
      throw error;
    }

    const ttlSeconds = parseTtlToSeconds(ttl, this.stdTTL);
    const expireAt = expireAtFromTtlSeconds(ttlSeconds);
    const stored = cloneValue(value, this.useClones);

    this.data.set(normalized, { value: stored, expireAt });
    this.bumpSnapshot(normalized, stored);

    if (this.persist) {
      try {
        persistSet(
          this.persist,
          this.prefix + normalized,
          stored,
          ttlSeconds,
          { compress: this.defaultCompress },
          this.onError,
        );
      } catch {
        return false;
      }
    }

    this.emit("set", normalized, stored);
    this.notifyKey(normalized);
    this.publishBus({ type: "set", key: normalized, version: this.version });
    return true;
  }

  get<T = unknown>(key: StorageKey): T | undefined {
    const normalized = normalizeKey(key);
    const entry = this.getEntry<T>(normalized);
    if (entry) {
      return cloneValue(entry.value, this.useClones);
    }

    if (this.persist) {
      const fromPersist = persistGet<T>(this.persist, this.prefix + normalized);
      if (fromPersist !== undefined) {
        this.data.set(normalized, {
          value: fromPersist,
          expireAt: 0,
        });
        this.bumpSnapshot(normalized, fromPersist);
        return cloneValue(fromPersist, this.useClones);
      }
    }

    return undefined;
  }

  del(key: StorageKey | StorageKey[]): number {
    const keys = Array.isArray(key) ? key : [key];
    let count = 0;

    for (const item of keys) {
      const normalized = normalizeKey(item);
      const hadMemory = this.data.delete(normalized);
      this.snapshots.delete(normalized);

      let hadPersist = false;
      if (this.persist) {
        hadPersist = this.persist.getItem(this.prefix + normalized) != null;
        persistRemove(this.persist, this.prefix + normalized);
      }

      if (hadMemory || hadPersist) {
        count++;
        this.emit("del", normalized, undefined);
        this.notifyKey(normalized);
        this.publishBus({ type: "del", key: normalized, version: this.version });
      }
    }

    return count;
  }

  has(key: StorageKey): boolean {
    return this.get(key) !== undefined;
  }

  ttl(key: StorageKey, ttl?: number | string): boolean {
    const normalized = normalizeKey(key);
    const entry = this.getEntry(normalized, false);
    if (!entry) {
      return false;
    }

    const ttlSeconds = parseTtlToSeconds(ttl, this.stdTTL);
    entry.expireAt = expireAtFromTtlSeconds(ttlSeconds);

    if (this.persist) {
      try {
        persistSet(
          this.persist,
          this.prefix + normalized,
          entry.value,
          ttlSeconds,
          { compress: this.defaultCompress },
          this.onError,
        );
      } catch {
        return false;
      }
    }

    this.notifyKey(normalized);
    return true;
  }

  getTtl(key: StorageKey): number | undefined {
    const normalized = normalizeKey(key);
    const entry = this.getEntry(normalized, false);
    if (!entry) {
      return undefined;
    }
    if (entry.expireAt === 0) {
      return 0;
    }
    const remaining = entry.expireAt - Date.now();
    if (remaining <= 0) {
      return undefined;
    }
    return entry.expireAt;
  }

  take<T = unknown>(key: StorageKey): T | undefined {
    const value = this.get<T>(key);
    if (value !== undefined) {
      this.del(key);
    }
    return value;
  }

  keys(): string[] {
    const keys = new Set<string>(this.data.keys());

    if (this.persist) {
      for (const prefixed of this.persist.keys()) {
        if (prefixed.startsWith(this.prefix)) {
          keys.add(prefixed.slice(this.prefix.length));
        }
      }
    }

    return Array.from(keys);
  }

  flushAll(): void {
    this.data.clear();
    this.snapshots.clear();

    if (this.persist) {
      for (const prefixed of this.persist.keys()) {
        if (prefixed.startsWith(this.prefix)) {
          this.persist.removeItem(prefixed);
        }
      }
    }

    this.emit("flush", "", undefined);
    this.notifyAll();
    this.publishBus({ type: "flush", version: this.version });
  }

  on(event: StorageEventName, listener: StorageEventListener): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, new Set());
    }
    this.eventListeners.get(event)!.add(listener);
  }

  off(event: StorageEventName, listener: StorageEventListener): void {
    this.eventListeners.get(event)?.delete(listener);
  }

  close(): void {
    if (this.closed) {
      return;
    }
    this.closed = true;
    if (this.checkTimer) {
      clearInterval(this.checkTimer);
      this.checkTimer = null;
    }
    this.busUnsubscribe?.();
    this.busUnsubscribe = null;
    instances.delete(this.instanceId);
  }

  getSnapshot<T>(key: StorageKey, fallback: T): T {
    const normalized = normalizeKey(key);
    const stored = this.get<T>(key);
    const next = stored !== undefined ? stored : fallback;
    const cached = this.snapshots.get(normalized);
    if (cached !== undefined && Object.is(cached, next)) {
      return cached as T;
    }
    this.snapshots.set(normalized, next);
    return next;
  }

  subscribe(key: StorageKey, listener: () => void): () => void {
    const normalized = normalizeKey(key);
    if (!this.keyListeners.has(normalized)) {
      this.keyListeners.set(normalized, new Set());
    }
    const listeners = this.keyListeners.get(normalized)!;
    listeners.add(listener);
    return () => listeners.delete(listener);
  }

  subscribeAll(listener: () => void): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  /** Functional update used by React hook */
  update<T>(key: StorageKey, updater: T | ((prev: T | undefined) => T), options?: SetOptions): T {
    const normalized = normalizeKey(key);
    const prev = this.get<T>(key);
    const next =
      typeof updater === "function"
        ? (updater as (prev: T | undefined) => T)(prev)
        : updater;
    this.set(normalized, next, options?.ttl);
    return next;
  }

  remove(key: StorageKey): void {
    this.del(key);
  }

  private getEntry<T>(key: string, hydratePersist = true): CacheEntry<T> | undefined {
    const memory = this.data.get(key) as CacheEntry<T> | undefined;
    if (memory) {
      if (this.isExpired(memory)) {
        this.handleExpired(key, memory.value);
        return undefined;
      }
      return memory;
    }

    if (hydratePersist && this.persist) {
      const fromPersist = persistGet<T>(this.persist, this.prefix + key);
      if (fromPersist !== undefined) {
        const entry: CacheEntry<T> = { value: fromPersist, expireAt: 0 };
        this.data.set(key, entry);
        return entry;
      }
    }

    return undefined;
  }

  private isExpired(entry: CacheEntry): boolean {
    return entry.expireAt > 0 && Date.now() >= entry.expireAt;
  }

  private handleExpired(key: string, value: unknown): void {
    this.emit("expired", key, value);
    if (this.deleteOnExpire) {
      this.data.delete(key);
      this.snapshots.delete(key);
      if (this.persist) {
        persistRemove(this.persist, this.prefix + key);
      }
      this.emit("del", key, undefined);
      this.publishBus({ type: "expired", key, version: this.version });
    } else {
      this.data.set(key, { value, expireAt: 0 });
    }
    this.notifyKey(key);
  }

  private checkExpired(): void {
    for (const [key, entry] of this.data.entries()) {
      if (this.isExpired(entry)) {
        this.handleExpired(key, entry.value);
      }
    }
  }

  private bumpSnapshot(key: string, value: unknown): void {
    this.version += 1;
    const current = this.snapshots.get(key);
    if (Object.is(current, value)) {
      return;
    }
    this.snapshots.set(key, value);
  }

  private emit(event: StorageEventName, key: string, value: unknown): void {
    const listeners = this.eventListeners.get(event);
    if (!listeners) {
      return;
    }
    for (const listener of listeners) {
      listener(key, value);
    }
  }

  private notifyKey(key: string): void {
    const listeners = this.keyListeners.get(key);
    if (listeners) {
      for (const listener of listeners) {
        listener();
      }
    }
    this.notifyAll();
  }

  private notifyAll(): void {
    for (const listener of this.globalListeners) {
      listener();
    }
  }

  private publishBus(event: Omit<CacheEvent, "source">): void {
    this.bus.publish({ ...event, source: this.busSource });
  }

  private handleRemoteEvent(event: CacheEvent): void {
    switch (event.type) {
      case "del":
      case "expired":
        if (event.key) {
          this.data.delete(event.key);
          this.snapshots.delete(event.key);
          if (this.persist) {
            persistRemove(this.persist, this.prefix + event.key);
          }
          this.notifyKey(event.key);
        }
        break;
      case "flush":
        this.data.clear();
        this.snapshots.clear();
        if (this.persist) {
          for (const prefixed of this.persist.keys()) {
            if (prefixed.startsWith(this.prefix)) {
              this.persist.removeItem(prefixed);
            }
          }
        }
        this.notifyAll();
        break;
      case "set":
        if (event.key) {
          this.data.delete(event.key);
          this.snapshots.delete(event.key);
          this.notifyKey(event.key);
        }
        break;
      default:
        break;
    }
  }
}

export function createStorage(options?: StorageOptions): Storage {
  const id = options?.id ?? options?.prefix ?? "@brushy:";
  const existing = instances.get(id);
  if (existing) {
    return existing;
  }
  return new BrushyStorage({ ...options, id });
}

export function getStorageInstance(id: string): Storage | undefined {
  return instances.get(id);
}

export function resetStorageRegistry(): void {
  for (const instance of instances.values()) {
    instance.close();
  }
  instances.clear();
}
