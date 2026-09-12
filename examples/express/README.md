# Brushy DI + Express

Feature-driven API. Routes and DI providers live inside each feature.

## Run

```bash
npm run dev
curl http://localhost:3001/users
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
