# ADR 001: Package split (v2)

## Status

Accepted

## Context

Single `@brushy/di` monolith (~77 KB) mixed React and core, hurting tree-shaking and RN bundle size.

## Decision

Split into `@brushy/di-core`, `@brushy/di-react`, `@brushy/di-monitor`, and `@brushy/di-otel` with `@brushy/di` umbrella.

## Consequences

- Smaller installs when using only core
- Monitor optional at package level
- Umbrella keeps backward-compatible imports

# ADR 002: Typed tokens

## Status

Accepted

## Decision

Use `createToken<T>()` (branded `symbol`) for compile-time inference without runtime cost.

## Consequences

- Legacy `Symbol`/`string` tokens still work with manual generics
- `defineModule()` generates typed tokens from provider maps

# ADR 003: Native EventBus

## Status

Accepted

## Decision

Replace `EventTarget` with Map-based `ContainerEventBus` for React Native compatibility.

# ADR 004: Framework integration via core and react

## Status

Accepted

## Context

Teams integrating with Express, Fastify, Next.js, or React Native need clear guidance on which `@brushy/di` packages to install.

## Decision

Use the existing v2 package split only. Document install order and per-stack recipes in Getting Started:

- Server (Express, Fastify, Next Route Handlers): `@brushy/di-core` + `server` / `runInRequestScope`
- Client (web, React Native): `@brushy/di-react` via `@brushy/di/react`
- Full stack: `@brushy/di` umbrella

See [Getting Started](../en/getting-started.md) (EN) and [Primeiros passos](../pt-br/getting-started.md) (PT-BR).

## Consequences

- Single package surface for all HTTP and mobile stacks
- No extra `peerDependencies` on Express, Next, or Fastify
- Onboarding relies on docs and recipes, not duplicate APIs
- Revisit a dedicated integration package only if framework-specific code exceeds ~150 lines and a peer dep is unavoidable
