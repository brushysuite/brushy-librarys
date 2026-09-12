# @brushy/storage-react

React bindings for [`@brushy/storage`](../storage/README.md). Uses `useSyncExternalStore` for persisted values (no `useEffect` sync).

## Install

```bash
npm install @brushy/storage @brushy/storage-react react
```

Peer dependencies:

- `react >= 18.0.0`
- `@brushy/storage` (install explicitly)

## Setup

```tsx
import { createStorage } from "@brushy/storage";
import { StorageProvider, useStorage } from "@brushy/storage-react";

const storage = createStorage({ persist: "local" });

function Root({ children }: { children: React.ReactNode }) {
  return <StorageProvider storage={storage}>{children}</StorageProvider>;
}
```

## `useStorage`

```tsx
function ThemeToggle() {
  const { value: theme, set, remove } = useStorage("ui:theme", "light");

  return (
    <button type="button" onClick={() => set(theme === "light" ? "dark" : "light")}>
      {theme}
    </button>
  );
}
```

## `useStorageContext`

Access the shared `Storage` instance from context (for custom hooks or non-keyed operations):

```tsx
import { useStorageContext } from "@brushy/storage-react";

function CacheStats() {
  const storage = useStorageContext();
  return <span>{storage.keys().length} keys</span>;
}
```

## API

| Export | Description |
| --- | --- |
| `StorageProvider` | Provides a `Storage` instance via React context |
| `useStorage(key, initial?)` | Subscribe to a key; returns `{ value, set, remove }` |
| `useStorageContext()` | Access the context `Storage` instance |
| `getDefaultStorage()` | Fallback storage when no provider is mounted |

## Related

- [@brushy/storage](../storage/README.md): `createStorage`, TTL, events, persist, CacheBus
- [React hooks docs](https://brushysuite.gfrancodev.com/docs/storage/react-hooks)
- [Migration from `@brushy/localstorage`](https://brushysuite.gfrancodev.com/docs/storage/migration)
