# @brushy/storage

Isomorphic memory-first cache with NodeCache-style DX, optional browser persist, TTL, events, and an invalidation bus for multi-runtime Brushy apps.

## Install

```bash
npm install @brushy/storage

# React hooks (separate package)
npm install @brushy/storage-react react
```

## Core (Node, browser, SSR)

```typescript
import { createStorage } from "@brushy/storage";

const cache = createStorage({
  stdTTL: 0,        // seconds; 0 = no expiry
  checkperiod: 600, // scan interval in seconds
  prefix: "@myapp:",
});

cache.set("session", { token: "abc" }, 3600);
cache.get("session");
cache.del("session");
cache.has("session");
cache.ttl("session", "1h");
cache.getTtl("session");
cache.take("session");
cache.keys();
cache.flushAll();
cache.on("expired", (key, value) => {});
cache.close();
```

### Persist (opt-in)

```typescript
const cache = createStorage({
  id: "my-app",
  persist: "local", // or "session" | custom SyncPersist adapter
  prefix: "@myapp:",
});
```

### Events

```typescript
cache.on("set", (key, value) => {});
cache.on("del", (key) => {});
cache.on("expired", (key, value) => {});
cache.on("flush", () => {});
```

### Invalidation bus (CacheBus)

Cross-tab (`BroadcastChannel`) and in-process sync are built in when instances share the same `id`.

For server ↔ client invalidation, pass a custom bus. **Invalidate keys; do not replicate values by default:**

```typescript
import { createStorage, type CacheBus } from "@brushy/storage";

const bus: CacheBus = {
  publish: (event) => ws.send(JSON.stringify(event)),
  subscribe: (handler) => {
    ws.on("message", (raw) => handler(JSON.parse(raw)));
    return () => ws.off("message", handler);
  },
};

createStorage({ id: "product", bus });
```

## React

React bindings live in **`@brushy/storage-react`** (not in this package).

```tsx
import { StorageProvider, useStorage } from "@brushy/storage-react";
```

See [packages/storage-react/README.md](../storage-react/README.md). Hooks use `useSyncExternalStore` only.

## Migration from `@brushy/localstorage`

| v1 (`@brushy/localstorage`) | v2 (`@brushy/storage`) |
| --- | --- |
| `new LocalStorage(prefix)` | `createStorage({ prefix, persist: "local" })` |
| `useStorage` / `useJSONStorage` / `useLazyStorage` | `useStorage` from `@brushy/storage-react` |
| `updateFields(patch)` | `set(prev => ({ ...prev, ...patch }))` |
| `JSONStorage`, `LazyStorage`, `getJSONSchema` | Removed. Use `createStorage` + `set`/`get` |
| Tuple return `[value, set, remove]` | Object `{ value, set, remove }` |

v1 on-disk envelope is **not** read automatically.

## Docs

- [Storage documentation](https://brushysuite.gfrancodev.com/docs/storage)
- [Migration from localstorage](https://brushysuite.gfrancodev.com/docs/storage/migration)

## License

MIT
