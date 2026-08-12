# @brushy/di - Dependency Injection

## Documentation

- [Getting Started](./getting-started.md)
- [Introduction](./README.md)
- [Migration v2](./migration-v2.md)
- [Container](./container.md)
- [React Hooks](./react-hooks.md)
- [Component Injection](./component-injection.md)
- [Utilities](./utilities.md)
- [Server](./server.md)
- [Best Practices](./best-practices.md)

## Packages (v2)

| Package | Description |
|---------|-------------|
| `@brushy/di` | Umbrella - installs all sub-packages |
| `@brushy/di-core` | Zero-dependency core |
| `@brushy/di-react` | React / React Native |
| `@brushy/di-monitor` | Optional monitoring |

## Main exports

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

Granular imports:

```typescript
import { Container, createToken } from "@brushy/di/core";
import { useInject } from "@brushy/di/react";
import { monitor } from "@brushy/di/monitor";
```
