# @brushy/di - Injeção de Dependências

## Documentação

- [Primeiros passos](./getting-started.md)
- [Introdução](./README.md)
- [Migração v2](./migration-v2.md)
- [Container](./container.md)
- [React Hooks](./react-hooks.md)
- [Injeção de Componentes](./component-injection.md)
- [Utilitários](./utilities.md)
- [Server](./server.md)
- [Boas Práticas](./best-practices.md)

## Pacotes (v2)

| Pacote | Descrição |
|--------|-----------|
| `@brushy/di` | Umbrella - instala todos os sub-pacotes |
| `@brushy/di-core` | Core zero-deps |
| `@brushy/di-react` | React / React Native |
| `@brushy/di-monitor` | Monitoramento opcional |

## Exports principais

```typescript
import {
  Container,
  createToken,
  defineModule,
  createBrushyApp,
  resolve,
  inject,
  server,
  cache,
  monitor,
  useInject,
  useInjectLazy,
  BrushyDIProvider,
} from "@brushy/di";
```

Imports granulares:

```typescript
import { Container, createToken } from "@brushy/di/core";
import { useInject } from "@brushy/di/react";
import { monitor } from "@brushy/di/monitor";
```
