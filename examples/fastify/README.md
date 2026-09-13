# Brushy DI + Fastify

Feature-driven API with `runInRequestScopeAsync` per route.

## Run

```bash
npm run dev
curl http://localhost:3002/users
```

## Layout

```text
src/
  server.ts
  app.ts
  app/container.ts
  features/
    users/
    health/
  shared/logger/
  routes/index.ts
```

See [Server Utilities](../../packages/di/docs/en/server.md).
