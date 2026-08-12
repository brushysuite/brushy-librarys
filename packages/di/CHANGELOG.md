# @brushy/di

## 2.0.0

### Breaking Changes

- **Package split**: the monolithic `@brushy/di` v1 is replaced by focused packages. Install `@brushy/di` (umbrella) or pick `@brushy/di-core`, `@brushy/di-react`, `@brushy/di-monitor`, and `@brushy/di-otel` individually.
- **Granular imports**: prefer `@brushy/di/core`, `/react`, `/monitor`, `/otel` or direct package imports instead of a single flat export surface.
- **`useLazyInject` removed**: use `useInjectLazy` instead.
- **Tokens**: prefer `createToken("NAME")` or `Symbol("NAME")` over string tokens to avoid collisions across modules.

See [Migration v2](./docs/en/migration-v2.md) (EN) and [Migração v2](./docs/pt-br/migration-v2.md) (PT-BR).

### Architecture

- `@brushy/di` remains the umbrella package and re-exports `@brushy/di-core`, `@brushy/di-react`, `@brushy/di-monitor`, and `@brushy/di-otel`.
- Dual **ESM + CJS** builds via tsup across published packages.
- Subpath exports on the umbrella: `@brushy/di/core`, `/react`, `/monitor`, `/otel`.
- Granular entry points on core: `@brushy/di-core/container`, `/cache`, `/resolve`, `/inject`, `/server`, `/request-scope`.

### @brushy/di-core

- **`createToken()`** and **`defineModule()`** with automatic type inference in `register`, `resolve`, and `inject`.
- **`deps()`** helper for typed factory and class dependency tuples.
- **Request scope** via `AsyncLocalStorage`: `runInRequestScope`, `runInRequestScopeAsync`, `server.brushyRequestScope()`, and `@brushy/di-core/request-scope`.
- **Lifecycles**: `singleton`, `transient`, `scoped`, `immutable`.
- **Performance**: `tryFastResolve` hot path for warm singleton/transient/scoped resolves; provider metadata cached at register time; optional `registerMany` for bulk registration; reduced overhead when no container observers are attached.
- **`compiled-creator`** and **`scoped-cache`** for optimized scoped resolution.
- **Native `ContainerEventBus`** (Map-based) for React Native compatibility (replaces `EventTarget`).

### @brushy/di-react

- **`useInject`** and **`useInjectLazy`** (lazy proxy resolves on first access) with inference from registered tokens.
- **`useInjectComponent`**: resolve swappable UI from the container; types infer from `useValue` without manual generics.
- **`setInjectComponentErrorRenderer`**: custom dev error UI for React Native (web keeps DOM fallback; non-DOM returns `null` and logs to console).
- **`BrushyDIProvider`**: context-first pattern; keep the container stable outside render.
- Cross-platform tests for web and React Native behavior.

### @brushy/di-monitor

- Extracted optional observability package (`monitor.create`, stats, event subscription).
- Still re-exported from `@brushy/di` and `@brushy/di/monitor`.

### @brushy/di-otel (new)

- First publish of **`@brushy/di-otel`**: `traceContainer` and `traceResolve` hooks for OpenTelemetry resolve tracing.
- Optional peer dependency on `@opentelemetry/api`.
- Re-exported from `@brushy/di/otel`.

### @brushy/di-bench (private, monorepo only)

- Tier 1 comparative benchmark suite: `@brushy/di-core` vs tsyringe, InversifyJS, awilix, and direct-`new` baseline.
- Eight scenarios: cold/warm singleton, transient, deep/wide graphs, factory deps, batch register, request scope.
- Exports results to JSON, Markdown, and CSV; methodology documented in `packages/di-bench/METHODOLOGY.md`.

### Documentation

- Getting Started guides (EN/PT) with stack-specific install recipes.
- Migration v2, component injection via `container.register` / `new Container({ providers })`, Symbol tokens, and best practices.
- TSDoc on umbrella entry points; TypeDoc config updated.

### Quality and tooling

- 100% test coverage targets on published packages (`di-core`, `di-react`, `di-monitor`, `di-otel`, umbrella re-exports).
- CI: typecheck, tests, coverage, publint, size-limit, dependency-cruiser boundaries.

---

## 1.0.4

### Minor Changes

- Improved lazy injection with a new `useInjectLazy` hook.

## 1.0.3

### Minor Changes

- Adds "immutable" lifecycle for dependency management.

  The new "immutable" lifecycle ensures that:

  - Instance is created only once
  - Never invalidated by the cache system
  - Not affected by garbage collector
  - Maintains consistent internal state throughout the application lifecycle

  Perfect for:

  - State managers like React Query, Redux, Zustand
  - API clients that need stable connections
  - Services that need consistent state across components

  Usage example:

  ```typescript
  const container = new Container({
    providers: [
      {
        provide: QUERY_CLIENT,
        useFactory: () => new QueryClient(),
        lifecycle: "immutable", // Will never be invalidated
      },
    ],
  });
  ```

---
