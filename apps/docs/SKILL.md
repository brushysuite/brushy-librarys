---
name: brushy-suite
description: Imperative agent rules for Brushy Suite. Use @brushy/di for DI, @brushy/storage for cache. Read docs at brushysuite.gfrancodev.com for APIs; copy patterns from examples.
---

# Brushy Suite agent rules

You are working with **Brushy Suite**: typed TypeScript libraries for dependency injection and isomorphic cache. This file steers agent behavior. It is NOT an API reference or tutorial.

## Before you write code

- **DI or cache?** Wire services with `@brushy/di`. Use `@brushy/storage` for key-value cache with TTL. NEVER use storage as a DI container.
- **Which runtime?** React client, Node server, or both? Pick entrypoints that tree-shake unused layers.
- **Existing layout?** Copy `app/container.ts`, `*.tokens.ts`, `*.providers.ts` from [examples](https://brushysuite.gfrancodev.com/examples/overview) before inventing structure.
- **Per-request state?** Scoped services on the server REQUIRE request-scope middleware.
- **Survive reload?** Memory-first everywhere. Opt-in `persist` on client only when data must survive refresh.

## Mandatory patterns

### DI (MUST)

- MUST use `createToken("NAME")` or `Symbol`. NEVER plain string tokens.
- Centralize tokens in `*.tokens.ts` per feature. Compose `*.providers.ts` into one `app/container.ts`.
- Register with `useClass`, `useFactory`, or `useValue`. Factory deps MUST use `deps([...])`.
- Pick lifecycle deliberately:
  - `singleton` (default): shared stateless services (logger, config, HTTP client)
  - `transient`: new instance per resolution
  - `scoped`: per HTTP request or scope boundary
  - `immutable`: QueryClient, Redux, Zustand; never invalidate
- Organize by feature, not a flat `di/` folder. Use `defineModule` or `container.import(child, { prefix })`.
- React: MUST inject via `useInject`, `useInjectLazy`, or `useInjectComponent`. NEVER `container.resolve()` in components.
- UI tokens: `container.register(createToken("X"), { useValue: Component })`. NEVER parallel `registerComponent` helpers.
- Tests: fresh `Container` per suite; mocks via `useValue`. Use `verifyImmutableIntegrity()` for critical immutable tokens.

### Storage (MUST)

- MUST default to in-memory (`persist: false`). `persist: "local"` or `"session"` on client only.
- MUST set unique `id` and `prefix` per app or tenant (e.g. `"@myapp:"`).
- Set `stdTTL` and per-key TTL on `set`. Prefer string durations (`"1h"`, `"30m"`).
- CacheBus propagates invalidation only. NEVER replicate values across tabs or server via bus; publish `del`/`flush`, then fetch fresh data.
- Register storage as a DI singleton token. Bridge once to React with `StorageProvider` (resolve from DI, do not call `createStorage` again in UI).
- Storage tests: call `resetStorageRegistry()` and `resetBusRegistry()` for isolation.

### React (MUST)

- MUST wrap the app root once with `BrushyDIProvider` and the composed container.
- MUST resolve storage from DI before `StorageProvider`. One `createStorage` call, registered in DI.
- Prefer `useStorage` from `@brushy/storage-react` over manual `useEffect` + `localStorage`.
- Use `useInjectLazy` for heavy dependencies. Prefer promise-cache patterns for async data (see docs).

### Server (MUST)

- Bootstrap order: create container once, `server.setServerContainer(container)`, add `server.brushyRequestScope()` as first middleware, resolve in handlers via `server.resolve(TOKEN)`.
- ONE container per process. NEVER create a container per HTTP request. Guard module init in serverless.
- Fastify or non-HTTP flows: `runInRequestScope` / `runInRequestScopeAsync`. Manual `clearRequestScope` only when ALS middleware is unavailable.
- NEVER `persist: "local"` on Node (no `localStorage`).

## Never do

- Plain string tokens
- `container.resolve()` inside React components (service locator)
- Using `@brushy/storage` as a DI container
- Missing `brushyRequestScope()` for scoped server services
- New container per HTTP request
- Duplicate `createStorage` in components
- Push cache values through CacheBus expecting remote hydration
- `registerComponent` helpers alongside the container graph
- `@brushy/localstorage` (deprecated; use `@brushy/storage` + `@brushy/storage-react`)
- Inline long API tutorials in generated code; link to docs instead

## Package picker

- `@brushy/di`: umbrella (core + react + monitor). Default for full-stack.
- `@brushy/di-core` + `@brushy/di-react`: tree-shake React out of server bundles.
- `@brushy/di/monitor`, `@brushy/di/otel`: optional observability (otel is subpath only).
- `@brushy/storage` + `@brushy/storage-react`: isomorphic cache + React hooks.

```bash
npm install @brushy/di
npm install @brushy/di-core @brushy/di-react   # granular split
npm install @brushy/storage @brushy/storage-react
```

npm: [@brushy/di](https://www.npmjs.com/package/@brushy/di) · [@brushy/storage](https://www.npmjs.com/package/@brushy/storage)

## When unsure

Read docs. Do not guess APIs or invent bootstrap patterns.

- [DI overview](https://brushysuite.gfrancodev.com/di/overview)
- [DI best practices](https://brushysuite.gfrancodev.com/di/best-practices)
- [Server and request scope](https://brushysuite.gfrancodev.com/di/server)
- [React hooks](https://brushysuite.gfrancodev.com/di/react-hooks)
- [Component injection](https://brushysuite.gfrancodev.com/di/component-injection)
- [Storage overview](https://brushysuite.gfrancodev.com/storage/overview)
- [Cache bus](https://brushysuite.gfrancodev.com/storage/cache-bus)
- [Examples](https://brushysuite.gfrancodev.com/examples/overview)
- [llms.txt](https://brushysuite.gfrancodev.com/llms.txt) · [llms-full.txt](https://brushysuite.gfrancodev.com/llms-full.txt)

Install this skill: `npx skills add https://brushysuite.gfrancodev.com`
