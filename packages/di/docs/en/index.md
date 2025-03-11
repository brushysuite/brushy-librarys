# @brushy/di - Dependency Injection System

## Official Documentation

- [Introduction and Basic Concepts](./README.md)
- [Container](./container.md)
- [React Hooks](./react-hooks.md)
- [Component Injection](./component-injection.md)
- [Utility Functions](./utilities.md)
- [Server Utilities](./server.md)
- [Best Practices](./best-practices.md)

## Main Exports

`@brushy/di` exports the following functionalities:

```typescript
// Main Class
export { Container } from "./core/container";

// Utility Functions
export { resolve } from "./lib/tools/resolve";
export { cache } from "./lib/tools/cache";
export { inject } from "./lib/tools/inject";
export { monitor } from "./lib/tools/monitor";
export { server } from "./lib/tools/server";

// React Hooks
export { useInject } from "./lib/tools/use-inject";
export { useLazyInject } from "./lib/tools/use-lazy-inject";

// Component Injection
export {
  useInjectComponent,
  registerComponent,
  createComponentsProvider,
} from "./lib/tools/inject-component";

// React Provider
export { BrushyDIProvider } from "./lib/web/index";
```

## Quick Guide

### Create a Container

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

### Resolve Dependencies

```typescript
const httpClient = container.resolve("HTTP_CLIENT");
```

### Use in React Components

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

### Inject Components

```tsx
import { useInjectComponent } from "@brushy/di";

const Button = useInjectComponent("BUTTON_COMPONENT");

function App() {
  return (
    <div>
      <Button variant="primary">Click Here</Button>
    </div>
  );
}
```
