# Brushy DI Examples

Minimal, copy-friendly examples organized by feature. DI lives inside each feature, not in a separate `di/` folder.

**Before running any example**, build the libraries from the monorepo root:

```bash
npm run build-packages
```

## Shared layout

```text
src/
  app/
    container.ts          # composes providers from features + shared
    App.tsx               # React only
  features/
    users/
      user.service.ts
      users.tokens.ts
      users.providers.ts
      users.route.ts      # Node only
      ui/
        user-list.tsx     # React only
    health/
      health.route.ts     # Node only
  shared/
    cache/                  # @brushy/storage (DI token + providers)
    logger/
      logger.ts
      logger.token.ts
      logger.providers.ts
  providers/              # React only
  routes/
    index.ts              # Node only — wires feature routes
  app.ts                  # Node only
  server.ts               # Node only
  main.tsx                # Vite entry
```

## Examples

| Example | Stack | Command | Demonstrates |
| --- | --- | --- | --- |
| [vite](./vite) | Vite + React | `npm run dev` | `useInject` + `useStorage` (persist local) |
| [expo](./expo) | Expo + React Native | `npm start` | same + `useStorage` (memory) + RN error renderer |
| [express](./express) | Express | `npm run dev` | `brushyRequestScope` + `@brushy/storage` cache |
| [fastify](./fastify) | Fastify | `npm run dev` | `runInRequestScopeAsync` + `@brushy/storage` cache |

## Root shortcuts

```bash
npm run example:vite
npm run example:expo
npm run example:express
npm run example:fastify
```

## Tests

Each example uses Vitest with SWC (same setup as `packages/di*`):

```bash
npm run build-packages
npm run test:examples
```

## CI note

Vite, Express, Fastify, and Expo run unit tests in CI. Expo dev server is validated manually.

## Documentation

- [Getting Started](../packages/di/docs/en/getting-started.md)
- [Component Injection](../packages/di/docs/en/component-injection.md)
- [Server Utilities](../packages/di/docs/en/server.md)
