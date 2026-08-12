# Utility Functions

`@brushy/di` provides several utility functions to facilitate the use of the dependency injection system in different contexts.

## Typed tokens

Use `createToken<T>()` to create tokens with automatic type inference in `register`, `resolve`, `inject`, and `useInject`.

### Import

```typescript
import { createToken, Container } from "@brushy/di";
```

### Basic usage

```typescript
interface AuthService {
  login(email: string): Promise<void>;
}

class AuthServiceImpl implements AuthService {
  async login(email: string) {
    console.log(email);
  }
}

const AUTH = createToken<AuthService>("AUTH");
const container = new Container();

container.register(AUTH, { useClass: AuthServiceImpl });

// Type inferred automatically - no manual generic
const auth = container.resolve(AUTH);
await auth.login("user@example.com");
```

### Class as token

```typescript
container.register(AuthServiceImpl, { useClass: AuthServiceImpl });
const auth = container.resolve(AuthServiceImpl); // type: AuthServiceImpl
```

### defineModule

```typescript
import { defineModule } from "@brushy/di";

const appModule = defineModule({
  auth: { useClass: AuthServiceImpl },
  logger: { useValue: console },
});

appModule.register(container);

const auth = resolve(appModule.tokens.auth); // AuthService
```

Legacy tokens (`Symbol` / `string`) still work but require a manual generic: `resolve<MyType>(TOKEN)`.

## Request Scope (AsyncLocalStorage)

On Node.js, `@brushy/di` binds the active HTTP request scope with `AsyncLocalStorage`. Scoped dependencies resolve automatically inside that scope.

### Import

```typescript
import {
  runInRequestScope,
  runInRequestScopeAsync,
  brushyRequestScope,
  isRequestScopeSupported,
  server,
} from "@brushy/di";
```

### Express middleware

```typescript
app.use(server.brushyRequestScope());
// resolve() / inject.resolve() use the active scope - no manual scope argument
```

### Scripts and tests

```typescript
runInRequestScope(() => {
  const svc = resolve(USER_SERVICE);
});

await runInRequestScopeAsync(async () => {
  await resolveAsync(DATABASE);
});
```

Use `isRequestScopeSupported()` to detect Node.js ALS. On React Native, pass an explicit `scope` in `InjectOptions` or use `BrushyDIProvider` context.

## resolve

The `resolve` function allows resolving dependencies globally, without needing to directly access the container.

### Import

```typescript
import { resolve } from "@brushy/di";
```

### Basic Usage

```typescript
// Resolve a dependency
const userService = resolve<UserService>("USER_SERVICE");

// Use the dependency
const users = await userService.getUsers();
```

### With Scope

```typescript
// Resolve a dependency with specific scope
const requestService = resolve<RequestService>("REQUEST_SERVICE", requestScope);
```

## inject

The `inject` object provides utilities for dependency injection in any context.

### Import

```typescript
import { inject } from "@brushy/di";
```

### Global Container Configuration

```typescript
// Create container
const container = new Container();

// Configure as global container
inject.setGlobalContainer(container, {
  autoCleanRequestScope: true,
});
```

### Dependency Resolution

```typescript
// Get the global container
const container = inject.getGlobalContainer();

// Resolve dependency
const userService = inject.resolve<UserService>("USER_SERVICE");

// Resolve async dependency
const database = await inject.resolveAsync<Database>("DATABASE");

// Clear request scope
inject.clearRequestScope();
```

## cache

The `cache` object provides utilities for managing promise caching.

### Import

```typescript
import { cache } from "@brushy/di";
```

### Clear Cache

```typescript
// Clear all promise cache
cache.clear();

// Clear cache for a specific token
cache.clear("USER_SERVICE");
```

## monitor

The `monitor` object provides utilities for monitoring and observing container behavior.

### Import

```typescript
import { monitor } from "@brushy/di";
```

### Create Monitor

```typescript
// Create a monitor for a container
const containerMonitor = monitor.create(container, {
  eventTypes: ["resolve", "error"],
  logToConsole: true,
  maxEvents: 100,
});

// Get recorded events
const events = containerMonitor.getEvents();

// Get statistics
const stats = containerMonitor.getStats();
console.log(`Error rate: ${stats.errorRate * 100}%`);

// Stop monitoring
containerMonitor.stop();

// Clear history
containerMonitor.clearHistory();
```

## BrushyDIProvider

The `BrushyDIProvider` component is used to provide a DI container to React components.

### Import

```typescript
import { BrushyDIProvider } from "@brushy/di";
```

### Basic Usage

```tsx
// Create container
const container = new Container();

// Provide container to the application
function App() {
  return (
    <BrushyDIProvider container={container}>
      <YourApp />
    </BrushyDIProvider>
  );
}
```

### With Scope

```tsx
// Create scope for the current request
const requestScope = {};

// Provide container with scope
function App() {
  return (
    <BrushyDIProvider container={container} scope={requestScope}>
      <YourApp />
    </BrushyDIProvider>
  );
}
```

## Complete Example

```typescript
import {
  Container,
  BrushyDIProvider,
  resolve,
  inject,
  cache,
  monitor,
} from "@brushy/di";

// Tokens
const LOGGER = Symbol("LOGGER");
const API_CLIENT = Symbol("API_CLIENT");
const USER_SERVICE = Symbol("USER_SERVICE");

// Classes
class Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class ApiClient {
  constructor(private baseUrl: string) {}

  async get(path: string) {
    return fetch(`${this.baseUrl}${path}`).then((r) => r.json());
  }
}

class UserService {
  constructor(
    private apiClient: ApiClient,
    private logger: Logger,
  ) {}

  async getUsers() {
    this.logger.log("Fetching users");
    return this.apiClient.get("/users");
  }
}

// Create container
const container = new Container();

// Register dependencies
container.register(LOGGER, { useClass: Logger });
container.register(API_CLIENT, {
  useFactory: () => new ApiClient("https://api.example.com"),
  lifecycle: "singleton",
});
container.register(USER_SERVICE, {
  useClass: UserService,
  dependencies: [API_CLIENT, LOGGER],
});

// Configure global container
inject.setGlobalContainer(container);

// Create monitor
const containerMonitor = monitor.create(container, {
  eventTypes: ["all"],
  logToConsole: true,
});

// Function that uses global resolution
async function fetchUsers() {
  try {
    const userService = resolve<UserService>(USER_SERVICE);
    return await userService.getUsers();
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  } finally {
    // Clear cache after use
    cache.clear(USER_SERVICE);
  }
}

// React Component
function UserList() {
  const [users, setUsers] = useState([]);
}
```
