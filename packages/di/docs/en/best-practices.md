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

### Detailed Logging
