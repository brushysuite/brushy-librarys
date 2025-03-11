# @brushy/di - Sistema de Injeção de Dependências

## Documentação Oficial

- [Introdução e Conceitos Básicos](./README.md)
- [Container](./container.md)
- [Hooks React](./react-hooks.md)
- [Injeção de Componentes](./component-injection.md)
- [Funções Utilitárias](./utilities.md)
- [Utilitários para Servidor](./server.md)
- [Boas Práticas](./best-practices.md)

## Exportações Principais

O `@brushy/di` exporta as seguintes funcionalidades:

```typescript
// Classe principal
export { Container } from "./core/container";

// Funções utilitárias
export { resolve } from "./lib/tools/resolve";
export { cache } from "./lib/tools/cache";
export { inject } from "./lib/tools/inject";
export { monitor } from "./lib/tools/monitor";
export { server } from "./lib/tools/server";

// Hooks React
export { useInject } from "./lib/tools/use-inject";
export { useLazyInject } from "./lib/tools/use-lazy-inject";

// Injeção de componentes
export {
  useInjectComponent,
  registerComponent,
  createComponentsProvider,
} from "./lib/tools/inject-component";

// Provider React
export { BrushyDIProvider } from "./lib/web/index";
```

## Guia Rápido

### Criar um Container

```typescript
import { Container } from "@brushy/di";

const container = new Container({
  providers: [
    {
      provide: "HTTP_CLIENT",
      useClass: HttpClient,
    },
    {
      provide: "CONFIG",
      useValue: { apiUrl: "https://api.example.com" },
    },
  ],
});
```

### Resolver Dependências

```typescript
const httpClient = container.resolve("HTTP_CLIENT");
```

### Usar em Componentes React

```tsx
import { BrushyDIProvider, useInject } from "@brushy/di";

function App() {
  return (
    <BrushyDIProvider container={container}>
      <UserList />
    </BrushyDIProvider>
  );
}

function UserList() {
  const userService = useInject("USER_SERVICE");
  // ...
}
```

### Injetar Componentes

```tsx
import { useInjectComponent } from "@brushy/di";

const Button = useInjectComponent("BUTTON_COMPONENT");

function App() {
  return (
    <div>
      <Button variant="primary">Clique Aqui</Button>
    </div>
  );
}
```
