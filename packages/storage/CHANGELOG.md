# @brushy/storage

## 2.0.0

### Major

- Initial release of `@brushy/storage` as the suite cache primitive.
- NodeCache-compatible sync API: `set`, `get`, `del`, `has`, `ttl`, `getTtl`, `take`, `keys`, `flushAll`, `on`, `close`.
- Memory-first runtime with optional `persist: "local" | "session" | SyncPersist`.
- `CacheBus` for cross-runtime invalidation (in-process + `BroadcastChannel` built in).
- React hooks moved to `@brushy/storage-react` (peer `react`, zero React in core).

### Deprecates

- `@brushy/localstorage` — use `@brushy/storage` instead.
