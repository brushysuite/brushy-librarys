export { LocalStorage } from "./lib/localstorage";
export { JSONStorage } from "./lib/json-storage";
export { LazyStorage } from "./lib/lazy-storage";
export { TypedCompression } from "./utils/compression";

export { useStorage } from "./hooks/use-storage";
export { useJSONStorage } from "./hooks/use-json-storage";
export { useLazyStorage } from "./hooks/use-lazy-storage";

export type {
  StorageOptions,
  StorageItem,
  StorageEventListener,
  IStorage,
} from "./core/types";
export type { LazyStorageOptions } from "./lib/lazy-storage";
export type { CompressionOptions, JSONStorageOptions } from "./core/types";
