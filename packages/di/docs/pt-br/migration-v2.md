# Guia de Migração - v1 para v2

`@brushy/di` v2 divide a biblioteca em pacotes focados, mantendo o install umbrella.

**Projeto novo?** Veja [Primeiros passos](./getting-started.md) - ordem de instalação por stack.

## Estrutura de pacotes

| Pacote | Quando usar |
|--------|-------------|
| `@brushy/di` | Stack completa (instala core + react + monitor + otel) |
| `@brushy/di-core` | Node, browser, RN sem React |
| `@brushy/di-react` | Hooks React / React Native |
| `@brushy/di-monitor` | Observabilidade opcional |
| `@brushy/di-otel` | OpenTelemetry tracing opcional |

## Mudanças de import

```typescript
// v1 - pacote único
import { Container, useInject, monitor } from '@brushy/di';

// v2 - mesmo import umbrella (recomendado)
import { Container, useInject, monitor, createToken } from '@brushy/di';

// v2 - granular
import { Container, createToken } from '@brushy/di-core';
import { useInject, BrushyDIProvider } from '@brushy/di-react';
import { monitor } from '@brushy/di-monitor';
```

Subpath exports no umbrella:

```typescript
import { Container } from '@brushy/di/core';
import { useInject } from '@brushy/di/react';
import { monitor } from '@brushy/di/monitor';
import { traceContainer } from '@brushy/di/otel';
```

## Tokens tipados (novo)

```typescript
const AUTH = createToken<AuthService>('AUTH');
container.register(AUTH, { useClass: AuthServiceImpl });
const auth = useInject(AUTH); // tipo inferido
```

## useInjectLazy (proxy lazy)

`useInjectLazy` retorna um **proxy** que resolve o serviço no primeiro acesso a uma propriedade ou método:

```typescript
const reportService = useInjectLazy(REPORT_SERVICE);
await reportService.generate(); // resolve aqui
```

## Depreciado

- `useLazyInject` → use `useInjectLazy`

## Injeção de componentes (React)

Registre UI no **container** com `useValue`. Prefira `createToken()` (Symbol em tempo de execução) em vez de tokens string:

```typescript
const SIDEBAR = container.register(createToken("SIDEBAR"), {
  useValue: AcmeSidebar,
});
```

Resolva nos componentes com `useInjectComponent(SIDEBAR)`. Os tipos são inferidos a partir do componente registrado; generics explícitos são opcionais.

Veja [Injeção de Componentes](./component-injection.md).

## OpenTelemetry (opcional)

```typescript
import { traceContainer } from "@brushy/di/otel";

const restore = traceContainer(container, { attributeToken: true });
// ... resolves são rastreados quando @opentelemetry/api está instalado
restore();
```

Instale `@brushy/di-otel` ou use o subpath `/otel` do umbrella. Requer `@opentelemetry/api`.

## React Native

Instale `@brushy/di` + `react`. Metro resolve o campo `react-native` automaticamente. Sem decorators.

Registre um renderer de erro customizado para `useInjectComponent`:

```tsx
import { setInjectComponentErrorRenderer } from "@brushy/di/react";

setInjectComponentErrorRenderer((message, details) => (
  // View/Text no React Native
));
```

Veja [Primeiros passos](./getting-started.md).

## Backend

Use `@brushy/di-core` ou `@brushy/di` com utilitários `server`. Cleanup de request scope continua manual ou via middleware (ver docs server).
