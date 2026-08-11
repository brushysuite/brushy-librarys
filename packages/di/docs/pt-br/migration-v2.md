# Guia de Migração — v1 para v2

`@brushy/di` v2 divide a biblioteca em pacotes focados, mantendo o install umbrella.

## Estrutura de pacotes

| Pacote | Quando usar |
|--------|-------------|
| `@brushy/di` | Stack completa (instala core + react + monitor) |
| `@brushy/di-core` | Node, browser, RN sem React |
| `@brushy/di-react` | Hooks React / React Native |
| `@brushy/di-monitor` | Observabilidade opcional |

## Mudanças de import

```typescript
// v1 — pacote único
import { Container, useInject, monitor } from '@brushy/di';

// v2 — mesmo import umbrella (recomendado)
import { Container, useInject, monitor, createToken } from '@brushy/di';

// v2 — granular
import { Container, createToken } from '@brushy/di-core';
import { useInject, BrushyDIProvider } from '@brushy/di-react';
import { monitor } from '@brushy/di-monitor';
```

Subpath exports no umbrella:

```typescript
import { Container } from '@brushy/di/core';
import { useInject } from '@brushy/di/react';
import { monitor } from '@brushy/di/monitor';
```

## Tokens tipados (novo)

```typescript
const AUTH = createToken<AuthService>('AUTH');
container.register(AUTH, { useClass: AuthServiceImpl });
const auth = useInject(AUTH); // tipo inferido
```

## Depreciado

- `useLazyInject` → use `useInjectLazy`

## React Native

Instale `@brushy/di` + `react`. Metro resolve o campo `react-native` automaticamente. Sem decorators.

## Backend

Use `@brushy/di-core` ou `@brushy/di` com utilitários `server`. Cleanup de request scope continua manual ou via middleware (ver docs server).
