import { useInject } from "@brushy/di-react";
import { StorageProvider } from "@brushy/storage-react";
import type { ReactNode } from "react";
import { APP_CACHE } from "../shared/cache/cache.token";

type StorageBridgeProps = {
  children: ReactNode;
};

export function StorageBridge({ children }: StorageBridgeProps) {
  const storage = useInject(APP_CACHE);
  return <StorageProvider storage={storage}>{children}</StorageProvider>;
}
