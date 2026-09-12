import { createStorage, type Storage, type StorageOptions } from "@brushy/storage";
import { createContext, useContext, type ReactNode } from "react";

const defaultStorage = createStorage({ id: "@brushy:default" });

const StorageContext = createContext<Storage>(defaultStorage);

export interface StorageProviderProps {
  children: ReactNode;
  storage?: Storage;
  options?: StorageOptions;
}

export function StorageProvider({ children, storage, options }: StorageProviderProps) {
  const value = storage ?? (options ? createStorage(options) : defaultStorage);
  return <StorageContext.Provider value={value}>{children}</StorageContext.Provider>;
}

export function useStorageContext(): Storage {
  return useContext(StorageContext);
}

export function getDefaultStorage(): Storage {
  return defaultStorage;
}
