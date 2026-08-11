# ADR 001: Package split (v2)

## Status

Accepted

## Context

Single `@brushy/di` monolith (~77 KB) mixed React and core, hurting tree-shaking and RN bundle size.

## Decision

Split into `@brushy/di-core`, `@brushy/di-react`, `@brushy/di-monitor` with `@brushy/di` umbrella.

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
