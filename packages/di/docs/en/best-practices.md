# Best Practices

This guide presents the best practices for using `@brushy/di` efficiently and in an organized manner.

## Token Organization

### Use Symbols for Tokens

Prefer using `Symbol` for tokens instead of strings, as they guarantee uniqueness and avoid collisions:

```typescript
// ✅ Good: Use Symbol
const USER_SERVICE = Symbol("USER_SERVICE");

// ❌ Avoid: Using string
const USER_SERVICE = "USER_SERVICE";
```

### Centralize Token Definition

Keep all tokens in a centralized location:

```typescript
// tokens.ts
export const TOKENS = {
  SERVICES: {
    USER_SERVICE: Symbol("USER_SERVICE"),
    AUTH_SERVICE: Symbol("AUTH_SERVICE"),
    PRODUCT_SERVICE: Symbol("PRODUCT_SERVICE"),
  },
  REPOSITORIES: {
    USER_REPOSITORY: Symbol("USER_REPOSITORY"),
    PRODUCT_REPOSITORY: Symbol("PRODUCT_REPOSITORY"),
  },
  UTILS: {
    LOGGER: Symbol("LOGGER"),
    CONFIG: Symbol("CONFIG"),
  },
  UI: {
    BUTTON: Symbol("BUTTON"),
    CARD: Symbol("CARD"),
  },
};
```

## Lifecycle

### Choose the Appropriate Lifecycle

- Use `singleton` for shared services (default)
- Use `transient` for instances that should not be shared
- Use `scoped` for instances that should be shared within a scope (e.g., HTTP request)
- Use `immutable` for state managers and instances that should never be invalidated

```typescript
// Shared service
container.register(TOKENS.SERVICES.CONFIG_SERVICE, {
  useClass: ConfigService,
  lifecycle: "singleton", // or omit, as it's the default
});

// Unique instance per use
container.register(TOKENS.SERVICES.FILE_PROCESSOR, {
  useClass: FileProcessor,
  lifecycle: "transient",
});

// Instance per request
container.register(TOKENS.SERVICES.REQUEST_CONTEXT, {
  useClass: RequestContext,
  lifecycle: "scoped",
});

// State managers that should never be invalidated
container.register(TOKENS.SERVICES.QUERY_CLIENT, {
  useFactory: () => new QueryClient(),
  lifecycle: "immutable",
});
```

### Use Immutable Lifecycle for State Managers

When working with state management libraries like React Query, Redux, or Zustand, use the `immutable` lifecycle to ensure the instance is never invalidated:

```typescript
// React Query
container.register(QUERY_CLIENT, {
  useFactory: () => new QueryClient(),
  lifecycle: "immutable"
});

// Redux Store
container.register(REDUX_STORE, {
  useFactory: () => createStore(rootReducer),
  lifecycle: "immutable"
});

// Zustand Store
container.register(APP_STORE, {
  useFactory: () => create(yourStore),
  lifecycle: "immutable"
});
```

### Clean Up Resources Properly

```typescript
// In web applications, clean up the request scope after each request
app.use((req, res, next) => {
  // Process request
  next();
  // After response is sent
  container.clearRequestScope();
});

// Use garbage collector to clean up unused instances
container.startGarbageCollector(60000, 30000);
```

## Application Structure

### Independent Modules

Organize your application into independent modules, each with its own container:

```typescript
// users module
const userModule = new Container();
userModule.register(USER_SERVICE, { useClass: UserService });
userModule.register(USER_REPOSITORY, { useClass: UserRepository });

// products module
const productModule = new Container();
productModule.register(PRODUCT_SERVICE, { useClass: ProductService });
productModule.register(PRODUCT_REPOSITORY, { useClass: ProductRepository });

// main container
const appContainer = new Container();
appContainer.import(userModule, { prefix: "user" });
appContainer.import(productModule, { prefix: "product" });
```

### Injection in React Components

Prefer using hooks for injection in React components:

```tsx
// ✅ Good: Use hooks
function UserList() {
  const userService = useInject(USER_SERVICE);
  // ...
}

// ❌ Avoid: Resolving directly in the component
function UserList() {
  const userService = container.resolve(USER_SERVICE);
  // ...
}
```

## Performance

### Promise Caching

Use promise caching to avoid multiple API calls:

```typescript
// ✅ Good: Use promise caching
function UserProfile({ userId }) {
  const userService = useInject(USER_SERVICE);
  const user = use(userService.getUserById(userId));
  return <div>{user.name}</div>;
}

// ❌ Avoid: Creating new promises on each render
function UserProfile({ userId }) {
  const userService = useInject(USER_SERVICE);
  const [user, setUser] = useState(null);

  useEffect(() => {
    userService.getUserById(userId).then(setUser);
  }, [userId, userService]);

  if (!user) return <div>Loading...</div>;
  return <div>{user.name}</div>;
}
```

### Lazy Loading

Use `useLazyInject` to load heavy dependencies only when needed:

```tsx
function ReportPage() {
  const [reportService, loadReportService] = useLazyInject(REPORT_SERVICE);

  const generateReport = () => {
    loadReportService();
    if (reportService) {
      reportService.generate();
    }
  };

  return (
    <div>
      <button onClick={generateReport}>Generate Report</button>
    </div>
  );
}
```

## Testability

### Test Containers

Create specific containers for tests:

```typescript
// test container
const testContainer = new Container();
testContainer.register(USER_SERVICE, {
  useClass: MockUserService
});

// test component
function renderWithDI(ui) {
  return render(
    <BrushyDIProvider container={testContainer}>
      {ui}
    </BrushyDIProvider>
  );
}

// test
test('renders user list', () => {
  renderWithDI(<UserList />);
  // ...
});
```

### Easy Mocking

Use `useValue` to inject mocks in tests:

```typescript
// service mock
const mockUserService = {
  getUsers: jest.fn().mockResolvedValue([
    { id: 1, name: "User 1" },
    { id: 2, name: "User 2" },
  ]),
};

// register mock
testContainer.register(USER_SERVICE, {
  useValue: mockUserService,
});
```

## Observability

### Monitor the Container

Use the monitor to debug issues:

```typescript
// create monitor
const containerMonitor = monitor.create(container, {
  eventTypes: ["resolve", "error"],
  logToConsole: true,
});

// analyze events after operations
const events = containerMonitor.getEvents();
const stats = containerMonitor.getStats();

console.log(`Error rate: ${stats.errorRate * 100}%`);
console.log(`Success rate: ${stats.resolveSuccessRate * 100}%`);
```

### Verify Immutable Integrity

Use the `verifyImmutableIntegrity` method to ensure immutable instances maintain their identity:

```typescript
// Create a verifier function
const verifyIntegrity = container.verifyImmutableIntegrity();

// Check integrity at critical points in your application
function checkSystemIntegrity() {
  const queryClientIntact = verifyIntegrity(QUERY_CLIENT);
  const reduxStoreIntact = verifyIntegrity(REDUX_STORE);
  
  if (!queryClientIntact || !reduxStoreIntact) {
    console.error("Immutable integrity violation detected!");
    // Take appropriate action
  }
}
```

### Detailed Logging

Enable debug mode for detailed logging:

```typescript
const container = new Container({
  debug: true,
  name: "AppContainer",
});
```

## Security

### Validation of Dependencies

Validate dependencies when registering them:

```typescript
function registerService(token, serviceClass, dependencies = []) {
  // Check if all dependencies are registered
  for (const dep of dependencies) {
    if (!container.registry.has(dep)) {
      throw new Error(`Dependency not registered: ${String(dep)}`);
    }
  }

  container.register(token, {
    useClass: serviceClass,
    dependencies,
  });
}
```

### Avoid Exposing Sensitive Services

Don't expose sensitive services directly:

```typescript
// ✅ Good: Expose only necessary methods
container.register(AUTH_SERVICE, {
  useFactory: () => {
    const authService = new AuthService();

    // Return only public methods
    return {
      login: authService.login.bind(authService),
      logout: authService.logout.bind(authService),
      isAuthenticated: authService.isAuthenticated.bind(authService),
    };
  },
});

// ❌ Avoid: Exposing the entire service
container.register(AUTH_SERVICE, {
  useClass: AuthService,
});
```

## Complete Architecture Example

```
src/
├── di/
│   ├── tokens.ts           # All token definitions
│   ├── container.ts        # Main container configuration
│   └── modules/            # DI modules
│       ├── auth.module.ts
│       ├── user.module.ts
│       └── product.module.ts
├── services/               # Service implementations
│   ├── auth/
│   ├── user/
│   └── product/
├── components/             # React components
│   ├── providers/          # DI providers
│   │   └── AppProvider.tsx # Main provider
│   └── ...
└── hooks/                  # Custom hooks
    └── useAuth.ts          # Hook using useInject
```

### tokens.ts

```typescript
export const TOKENS = {
  SERVICES: {
    AUTH: Symbol("AUTH_SERVICE"),
    USER: Symbol("USER_SERVICE"),
    PRODUCT: Symbol("PRODUCT_SERVICE"),
  },
  REPOSITORIES: {
    USER: Symbol("USER_REPOSITORY"),
    PRODUCT: Symbol("PRODUCT_REPOSITORY"),
  },
  UI: {
    BUTTON: Symbol("BUTTON"),
    CARD: Symbol("CARD"),
  },
  STATE: {
    QUERY_CLIENT: Symbol("QUERY_CLIENT"),
    STORE: Symbol("STORE"),
  }
};
```

### container.ts

```typescript
import { Container } from "@brushy/di";
import { authModule } from "./modules/auth.module";
import { userModule } from "./modules/user.module";
import { productModule } from "./modules/product.module";
import { TOKENS } from "./tokens";
import { QueryClient } from "react-query";

export function createAppContainer() {
  const container = new Container({ name: "AppContainer" });

  // Register state managers with immutable lifecycle
  container.register(TOKENS.STATE.QUERY_CLIENT, {
    useFactory: () => new QueryClient(),
    lifecycle: "immutable"
  });

  // Import modules
  container.import(authModule);
  container.import(userModule);
  container.import(productModule);

  // Start garbage collector
  container.startGarbageCollector();

  return container;
}

export const appContainer = createAppContainer();
```

### AppProvider.tsx

```tsx
import { BrushyDIProvider, inject } from "@brushy/di";
import { appContainer } from "../di/container";
import { QueryClientProvider } from "react-query";
import { TOKENS } from "../di/tokens";

// Set global container
inject.setGlobalContainer(appContainer);

export function AppProvider({ children }) {
  // Get the immutable query client
  const queryClient = inject.resolve(TOKENS.STATE.QUERY_CLIENT);

  return (
    <BrushyDIProvider container={appContainer}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </BrushyDIProvider>
  );
}
```

### useAuth.ts

```typescript
import { useInject } from "@brushy/di";
import { TOKENS } from "../di/tokens";
import { useState, useEffect } from "react";

export function useAuth() {
  const authService = useInject(TOKENS.SERVICES.AUTH);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setIsAuthenticated(authService.isAuthenticated());

    // Subscribe to authentication changes
    const unsubscribe = authService.subscribe((state) => {
      setIsAuthenticated(state.isAuthenticated);
    });

    return unsubscribe;
  }, [authService]);

  return {
    isAuthenticated,
    login: authService.login,
    logout: authService.logout,
  };
}
```