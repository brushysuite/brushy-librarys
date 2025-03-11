export interface StorageOptions {
  ttl?: number;
  compress?: boolean;
}

export interface StorageItem<T> {
  value: T;
  timestamp: number;
  ttl?: number;
  compressed?: boolean;
}

export type StorageEventListener = (
  key: string,
  newValue: any,
  oldValue: any,
) => void;

export interface IStorage {
  set<T>(key: string, value: T, options?: StorageOptions): void;
  get<T>(key: string): T | null;
  remove(key: string): void;
  clear(): void;
  has(key: string): boolean;
  getSize(key: string): number;
  getTTL(key: string): number | null;
  subscribe(key: string, listener: StorageEventListener): () => void;
}

export interface CompressionOptions {
  threshold?: number; // Tamanho mínimo em bytes para comprimir
  mode?: "auto" | "aggressive" | "conservative";
}

export type DataType =
  | "string"
  | "array"
  | "object"
  | "number"
  | "date"
  | "binary";

export interface JSONStorageOptions extends StorageOptions {
  pretty?: boolean;
  replacer?: (key: string, value: any) => any;
  reviver?: (key: string, value: any) => any;
}

export interface LazyStorageOptions extends JSONStorageOptions {
  compression?: CompressionOptions;
  chunkSize?: number;
  lazyFields?: string[];
  preloadFields?: string[];
}
