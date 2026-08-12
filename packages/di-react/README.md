# @brushy/di-react

React and React Native bindings for `@brushy/di-core`.

## Installation

```bash
npm install @brushy/di-react @brushy/di-core
# or
yarn add @brushy/di-react @brushy/di-core
# or
pnpm add @brushy/di-react @brushy/di-core
```

Peer dependencies:

- `react >= 18.0.0`
- `@brushy/di-core` (runtime dependency of this package; install explicitly when not using `@brushy/di`)

Works in web and React Native projects. The `react-native` field in `package.json` points to the ESM build so Metro picks the correct bundle automatically.

## Web usage

Create a stable `Container` outside the render tree and pass it to `BrushyDIProvider`:

```tsx
import { Container, createToken } from '@brushy/di-core';
import { BrushyDIProvider, useInject, useInjectLazy } from '@brushy/di-react';

const container = new Container();
const USER_SERVICE = container.register(createToken('USER_SERVICE'), {
  useClass: UserService,
  lifecycle: 'singleton',
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <BrushyDIProvider container={container}>
      {children}
    </BrushyDIProvider>
  );
}

function Profile() {
  const userService = useInject(USER_SERVICE); // typed, no generic needed
  const reportService = useInjectLazy(REPORT_SERVICE); // resolved on first access
  // ...
}
```

For large apps, prefer the Context-first pattern: keep the container stable (created once at module level or memoized in the app) and avoid relying on the global registry inside render.

### Component injection

Register components on the container with **`createToken`** (runtime `Symbol`, no collisions). Types infer from `useValue`:

```tsx
import { Container, createToken } from '@brushy/di-core';
import { BrushyDIProvider, useInjectComponent } from '@brushy/di-react';

const container = new Container();

const DASHBOARD = container.register(createToken('DASHBOARD'), {
  useValue: DashboardPage,
});

function App() {
  const Dashboard = useInjectComponent(DASHBOARD);

  return (
    <BrushyDIProvider container={container}>
      <Dashboard />
    </BrushyDIProvider>
  );
}
```

Do not use string tokens (`"DASHBOARD"`). Prefer `createToken('DASHBOARD')` or `Symbol('DASHBOARD')`.

## React Native usage

The same provider and hooks work in React Native.

```tsx
import { Text, View } from 'react-native';
import { Container, createToken } from '@brushy/di-core';
import { BrushyDIProvider, useInject } from '@brushy/di-react';

const container = new Container();
const API_URL = container.register(createToken('API_URL'), {
  useValue: 'https://api.example.com',
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <BrushyDIProvider container={container}>{children}</BrushyDIProvider>;
}

function HomeScreen() {
  const apiUrl = useInject(API_URL);
  return (
    <View>
      <Text>API: {apiUrl}</Text>
    </View>
  );
}
```

> **React Native:** register native components via tokens. For dev error UI from `useInjectComponent`, set a platform renderer once at app bootstrap:

```tsx
import { Text, View } from 'react-native';
import { setInjectComponentErrorRenderer } from '@brushy/di-react';

setInjectComponentErrorRenderer((message, details) => (
  <View>
    <Text>{message}</Text>
    {details ? <Text>{details}</Text> : null}
  </View>
));
```

Without a custom renderer, non-DOM environments return `null` (errors still log to `console.error`).

## Server usage

React hooks must not run during server rendering. Use `@brushy/di-core` on the server:

```ts
import { Container, runInRequestScope } from '@brushy/di-core';

const container = new Container();

app.get('/api/users', async (req, res) => {
  const result = await runInRequestScope(() => container.resolve(USER_SERVICE).list());
  res.json(result);
});
```

For integrating with React server components or non-React code, use the explicit bridge API (`registerReactContainer` / `unregisterReactContainer`) outside the render lifecycle.

## Public API

| Export | Description |
| --- | --- |
| `BrushyDIProvider` | Provides the DI container via React context |
| `useInject` | Eager dependency injection with optional promise caching |
| `useInjectLazy` | Lazy proxy injection (resolve on first access) |
| `useInjectComponent` | Resolve React components registered in the container |
| `registerComponent` | Register a single component token |
| `registerComponents` | Register a map of component tokens |
| `createComponentsProvider` | Helper provider that registers components once |
| `setInjectComponentErrorRenderer` | Custom dev error UI (required for RN) |
| `useDIContainer` | Access the container from context |
| `registerReactContainer` / `unregisterReactContainer` | Bridge for server / legacy integration |
| `bridgeContainer` | Attach a container to the React registry |
| `ROOT_SCOPE`, `DIContext` | Scope and context primitives |

Types: `BrushyDIProviderProps`, `InjectComponentErrorRenderer`, `InjectOptions`.

## Large apps

- Keep the container stable and pass it directly to `BrushyDIProvider`.
- Do not trigger registry mutations or module registration during render.
- Use the bridge API only when integrating with legacy code, server middleware, or non-React modules.
- Register components with `container.register(createToken('…'), { useValue })` during bootstrap, not inside components.

## Related docs

Full React hook guide (umbrella package): [`packages/di/docs/en/react-hooks.md`](../di/docs/en/react-hooks.md)
