import type { CacheBus, CacheEvent } from "./types";

const registryListeners = new Map<string, Set<(event: CacheEvent) => void>>();

export function getRegistryChannel(id: string): CacheBus {
  if (!registryListeners.has(id)) {
    registryListeners.set(id, new Set());
  }
  const listeners = registryListeners.get(id)!;

  return {
    publish: (event) => {
      for (const listener of listeners) {
        listener(event);
      }
    },
    subscribe: (handler) => {
      listeners.add(handler);
      return () => listeners.delete(handler);
    },
  };
}

export function createBroadcastBus(channelName: string): CacheBus | null {
  if (typeof globalThis.BroadcastChannel === "undefined") {
    return null;
  }

  const channel = new BroadcastChannel(channelName);
  const localListeners = new Set<(event: CacheEvent) => void>();

  channel.onmessage = (message) => {
    const event = message.data as CacheEvent;
    for (const listener of localListeners) {
      listener(event);
    }
  };

  return {
    publish: (event) => {
      channel.postMessage(event);
      for (const listener of localListeners) {
        listener(event);
      }
    },
    subscribe: (handler) => {
      localListeners.add(handler);
      return () => localListeners.delete(handler);
    },
  };
}

export function composeBuses(...buses: (CacheBus | null | undefined)[]): CacheBus {
  const active = buses.filter((bus): bus is CacheBus => bus != null);

  return {
    publish: (event) => {
      for (const bus of active) {
        bus.publish(event);
      }
    },
    subscribe: (handler) => {
      const unsubs = active.map((bus) => bus.subscribe(handler));
      return () => {
        for (const unsub of unsubs) {
          unsub();
        }
      };
    },
  };
}

export function resetBusRegistry(): void {
  registryListeners.clear();
}
