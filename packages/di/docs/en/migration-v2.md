# Migration Guide — v1 to v2

`@brushy/di` v2 splits the library into focused packages while keeping the umbrella install.

## Package structure

| Package | Use when |
|---------|----------|
| `@brushy/di` | Full stack (installs core + react + monitor) |
| `@brushy/di-core` | Node, browser, RN without React |
| `@brushy/di-react` | React / React Native hooks |
| `@brushy/di-monitor` | Optional observability |

## Import changes

```typescript
// v1 — single package
import { Container, useInject, monitor } from '@brushy/di';

// v2 — same umbrella import (recommended)
import { Container, useInject, monitor, createToken } from '@brushy/di';

// v2 — granular
import { Container, createToken } from '@brushy/di-core';
import { useInject, BrushyDIProvider } from '@brushy/di-react';
import { monitor } from '@brushy/di-monitor';
```

Subpath exports on the umbrella:

```typescript
import { Container } from '@brushy/di/core';
import { useInject } from '@brushy/di/react';
import { monitor } from '@brushy/di/monitor';
```

## Typed tokens (new)

```typescript
const AUTH = createToken<AuthService>('AUTH');
container.register(AUTH, { useClass: AuthServiceImpl });
const auth = useInject(AUTH); // inferred type
```

## Deprecated

- `useLazyInject` → use `useInjectLazy`

## React Native

Install `@brushy/di` + `react`. Metro resolves `react-native` field automatically. No decorators required.

## Backend

Use `@brushy/di-core` or `@brushy/di` with `server` utilities. Request scope cleanup remains manual or use middleware pattern (see server docs).
