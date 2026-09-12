export type {
  CompressionOptions,
  IStorage,
  JSONStorageOptions,
  StorageEventListener,
  StorageItem,
  StorageOptions,
} from "./core/types";
export { useJSONStorage } from "./hooks/use-json-storage";
export { useLazyStorage } from "./hooks/use-lazy-storage";

export { useStorage } from "./hooks/use-storage";
export { JSONStorage } from "./lib/json-storage";
export type { LazyStorageOptions } from "./lib/lazy-storage";
export { LazyStorage } from "./lib/lazy-storage";
export { LocalStorage } from "./lib/localstorage";
export { TypedCompression } from "./utils/compression";
