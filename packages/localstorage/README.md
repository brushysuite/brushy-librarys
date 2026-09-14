<div align="center">
  <img src="../../apps/docs/apple-touch-icon.png" alt="Brushy Suite" width="128" />
  <h1>@brushy/localstorage</h1>
  <p><strong>Deprecated</strong> — use @brushy/storage instead</p>
</div>

<p align="center">
  <a href="https://www.npmjs.com/package/@brushy/localstorage"><img src="https://img.shields.io/npm/v/@brushy/localstorage.svg" alt="npm version" /></a>
</p>

> **This package is deprecated.** Use [`@brushy/storage`](../storage/README.md) and [`@brushy/storage-react`](../storage-react/README.md) instead.

`@brushy/localstorage` will not receive new features. Migrate to the v2 storage stack for:

- NodeCache-style cache on Node and in the browser
- Correct React hooks (`useSyncExternalStore`) via `@brushy/storage-react`
- Optional `localStorage` / `sessionStorage` persist
- Cross-runtime invalidation via `CacheBus`

## Migration

```bash
npm uninstall @brushy/localstorage
npm install @brushy/storage @brushy/storage-react react
```

| v1 (`@brushy/localstorage`) | v2 |
| --- | --- |
| `new LocalStorage(prefix)` | `createStorage({ prefix, persist: "local" })` |
| `useStorage` / `useJSONStorage` / `useLazyStorage` | `useStorage` from `@brushy/storage-react` |
| `updateFields(patch)` | `set(prev => ({ ...prev, ...patch }))` |
| Tuple return `[value, set, remove]` | Object `{ value, set, remove }` |

v1 on-disk envelope is **not** read automatically. See the [migration guide](https://brushysuite.gfrancodev.com/storage/migration).

## Docs

- [@brushy/storage](https://www.npmjs.com/package/@brushy/storage) · [README](../storage/README.md)
- [@brushy/storage-react](https://www.npmjs.com/package/@brushy/storage-react) · [README](../storage-react/README.md)
- [Storage overview](https://brushysuite.gfrancodev.com/storage/overview)
