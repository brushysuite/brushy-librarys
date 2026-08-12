# @brushy/di-react

Part of the [@brushy/di 2.0.0](../di/CHANGELOG.md) umbrella release.

## 2.0.0

First published release of `@brushy/di-react`.

### Added

- `BrushyDIProvider` and `useDIContainer` for React context integration.
- `useInject` with typed inference from registered tokens.
- `useInjectLazy`: lazy proxy injection (replaces v1 `useLazyInject`).
- `useInjectComponent`: resolve React components registered on the container with `useValue`; props infer from the implementation.
- `setInjectComponentErrorRenderer`: platform-specific dev error UI (required for React Native).
- Optional helpers: `registerComponent`, `registerComponents`, `createComponentsProvider`.
- `react-native` field points to ESM build for Metro.

### Breaking

- React bindings extracted from v1 `@brushy/di`. Use `@brushy/di-react` or `@brushy/di/react`.
- `useLazyInject` renamed to `useInjectLazy`.

See the [full umbrella changelog](../di/CHANGELOG.md#200) for migration details.
