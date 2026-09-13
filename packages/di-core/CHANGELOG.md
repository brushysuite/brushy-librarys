# @brushy/di-core

Part of the [@brushy/di 2.0.0](../di/CHANGELOG.md) umbrella release.

## 2.0.0

First published release of `@brushy/di-core`.

### Added

- Zero-React DI core for Node.js, browsers, and React Native.
- `Container` with `register`, `resolve`, `import`, child containers, and constructor `providers`.
- Typed tokens: `createToken()`, `defineModule()`, `deps()` for factory/class dependencies.
- Lifecycles: `singleton`, `transient`, `scoped`, `immutable`.
- Request scope via `AsyncLocalStorage`: `runInRequestScope`, `runInRequestScopeAsync`, `server` facade and `@brushy/di-core/request-scope`.
- Granular exports: `/container`, `/cache`, `/resolve`, `/inject`, `/server`, `/request-scope`.
- Performance: `tryFastResolve`, provider metadata cache, `registerMany`, observer skip on hot paths.
- `compiled-creator` and `scoped-cache` for scoped resolution.
- Map-based `ContainerEventBus` (React Native safe).

### Breaking

- Core logic moved out of the v1 monolithic `@brushy/di` package. Update imports to `@brushy/di-core` or `@brushy/di/core`.

See the [full umbrella changelog](../di/CHANGELOG.md#200) for migration details.
