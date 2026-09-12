# @brushy/di-core

Zero-React dependency injection for Node.js, browsers, and React Native. Part of the [@brushy/di 2.0](../di/README.md) umbrella.

## Install

```bash
npm install @brushy/di-core
```

## Quick start

```typescript
import { Container, createToken } from "@brushy/di-core";

const LOGGER = createToken<{ log: (msg: string) => void }>("LOGGER");

const container = new Container();
container.register(LOGGER, {
  useValue: { log: console.log },
});

const logger = container.resolve(LOGGER);
logger.log("ready");
```

## Features

- **Lifecycles**: `singleton`, `transient`, `scoped`, `immutable`
- **Typed tokens**: `createToken`, `deps`, `defineModule`
- **Request scope**: `runInRequestScope`, `runInRequestScopeAsync`, `brushyRequestScope` (AsyncLocalStorage on Node)
- **Server facade**: `server.setServerContainer`, `server.resolve`, `server.brushyRequestScope()`
- **Modules**: `defineModule`, `container.import`, `createBrushyApp`
- **Subpath exports**: `@brushy/di-core/container`, `/resolve`, `/inject`, `/server`, `/request-scope`, `/cache`

## Lifecycles

```typescript
container.register(TOKEN, { useClass: MyService, lifecycle: "singleton" });
container.register(TOKEN, { useClass: MyService, lifecycle: "transient" });
container.register(TOKEN, { useClass: MyService, lifecycle: "scoped" });
```

Scoped instances are isolated per request when you use request-scope middleware or `runInRequestScope`.

## Request scope (Node)

```typescript
import { runInRequestScope, server } from "@brushy/di-core";

server.setServerContainer(container);
app.use(server.brushyRequestScope());

app.get("/users", () => {
  return server.resolve(USER_SERVICE).list();
});

// Or manually:
await runInRequestScopeAsync(async () => {
  return container.resolve(USER_SERVICE).list();
});
```

## Modules

```typescript
import { defineModule, Container } from "@brushy/di-core";

export const usersModule = defineModule({
  userRepo: { useClass: UserRepository, lifecycle: "scoped" },
  userService: { useClass: UserService, lifecycle: "scoped" },
});

const container = new Container({ name: "app" });
usersModule.register(container);
const USER_SERVICE = usersModule.tokens.userService;
```

## Related packages

| Package | Role |
| --- | --- |
| [`@brushy/di-react`](../di-react/README.md) | React / React Native hooks |
| [`@brushy/di-monitor`](../di-monitor/README.md) | Container event monitoring |
| [`@brushy/di-otel`](../di-otel/README.md) | OpenTelemetry resolve tracing |
| [`@brushy/di`](../di/README.md) | Umbrella install (all of the above) |

## Docs and examples

- [Full documentation](https://brushysuite.gfrancodev.com/docs/di)
- [Server utilities](https://brushysuite.gfrancodev.com/docs/di/server)
- [Example projects](../../examples/README.md) (Express, Fastify, Vite, Expo)
