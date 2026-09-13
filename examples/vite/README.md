# Brushy DI + Vite

Feature-driven React app. Each feature owns its tokens, providers, service, and UI.

## Run

```bash
npm run build-packages   # from monorepo root
npm run dev
```

Open http://localhost:5173

## Layout

```text
src/
  main.tsx
  app/
    container.ts
    App.tsx
  features/users/
    user.service.ts
    users.tokens.ts
    users.providers.ts
    ui/user-list.tsx
  shared/logger/
  providers/
```

See [Component Injection](../../packages/di/docs/en/component-injection.md).
