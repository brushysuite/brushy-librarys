# Container

The `Container` is the central component of the dependency injection system. It is responsible for registering, resolving and managing the lifecycle of dependencies.

## Import

```typescript
import { Container } from "@brushy/di";
```

## Creating a Container

```typescript
// Basic container
const container = new Container();

// Container with initial providers
const container = new Container({
  providers: [
    {
      provide: "HTTP_CLIENT",
      useClass: HttpClient,
      lifecycle: "singleton",
      dependencies: ["CONFIG_SERVICE"],
    },
    {
      provide: "CONFIG_SERVICE",
      useValue: { apiUrl: "https://api.example.com" },
    },
    {
      provide: "LOGGER",
      useFactory: () => new Logger("app"),
      lifecycle: "transient",
    },
  ],
  debug: true,
  name: "AppContainer",
});
```

## API

### Dependency Registration

```typescript
// Class registration
container.register("USER_SERVICE", {
  useClass: UserService,
  dependencies: ["HTTP_CLIENT", "LOGGER"],
});

// Value registration
container.register("API_URL", {
  useValue: "https://api.example.com",
});

// Factory registration
container.register("DATABASE", {
  useFactory: () => createDatabaseConnection(),
  lifecycle: "singleton",
});
```

### Dependency Resolution

```typescript
// Synchronous resolution
const userService = container.resolve<UserService>("USER_SERVICE");

// Asynchronous resolution
const database = await container.resolveAsync<Database>("DATABASE");
```

### Lifecycle Management

```typescript
// Clear request scope
container.clearRequestScope();

// Start garbage collector
container.startGarbageCollector(60000, 30000);

// Stop garbage collector
container.stopGarbageCollector();

// Invalidate dependency cache
container.invalidateCache("USER_SERVICE");
```

### React Integration

```typescript
// Get a cached promise for use with the 'use' hook
const data = use(container.getPromise("HTTP_CLIENT", "fetchData", ["/users"]));
```

### Observability

```typescript
// Observe container events
const unsubscribe = container.observe((event) => {
  console.log(`Event: ${event.type}`, event);
});

// Stop observing
unsubscribe();
```

### Import/Export

```typescript
// Import providers from another container
container.import(otherContainer, {
  prefix: "other",
  overrideExisting: false,
});

// Export providers
const providers = container.exportProviders();
```

## Debug Mode

The Container has a powerful debug mode that allows detailed visualization of the dependency resolution process. When enabled, it displays colored console logs showing:

- Dependency registration
- Dependency resolution
- Dependency graph
- Cached instances
- Resolution errors and issues
- Instance lifecycles

### Enabling Debug Mode

```typescript
// When creating the container
const container = new Container({
  debug: true,
  name: "AppContainer",
});

// Example log output
// [DEBUG] Resolved USER_SERVICE (UserServiceImpl) synchronously
// [DEBUG] Dependencies for USER_SERVICE: HTTP_CLIENT, LOGGER
// [INFO] Dependency Relationships:
// [DEBUG] • HTTP_CLIENT (HttpClientImpl) ← Used by: USER_SERVICE (UserServiceImpl)
// [DEBUG] • LOGGER (ConsoleLogger) ← Used by: USER_SERVICE (UserServiceImpl)
```

### Logging System

The debug mode uses an internal logging system with color formatting for easy visualization:

- **INFO** (green): General information and section titles
- **DEBUG** (cyan): Details about dependency resolution and registration
- **WARN** (yellow): Warnings about potential issues
- **ERROR** (red): Critical errors like circular dependencies

Additionally, the logger uses specific colors for different types of information:

- **Tokens** (magenta): Dependency identifiers
- **Classes** (bright yellow): Implementation names
- **Lifecycle** (bright cyan): Lifecycle types

```typescript
// Example colored output (represented textually)
[INFO] Registered Tokens:
[DEBUG] • USER_SERVICE: UserServiceImpl (singleton)
[DEBUG] • HTTP_CLIENT: HttpClientImpl (singleton)
[DEBUG] • LOGGER: ConsoleLogger (transient)

[ERROR] Circular dependency detected: AUTH_SERVICE -> USER_SERVICE -> AUTH_SERVICE
```

> **Note**: The logging system has an intelligent mechanism to prevent duplicate messages. Identical messages emitted within a 200ms interval are automatically suppressed, preventing console pollution during repetitive operations or loops.

### Information Displayed in Debug Mode

Debug mode displays detailed information about:

1. **Dependency Resolution**: Shows when and how each dependency is resolved

   ```
   [DEBUG] Resolved USER_SERVICE (UserServiceImpl) synchronously
   ```

2. **Dependency Graph**: Displays the complete dependency graph after first resolution

   ```
   [INFO] Dependency Relationships:
   [DEBUG] • HTTP_CLIENT (HttpClientImpl) ← Used by: USER_SERVICE (UserServiceImpl)
   ```

3. **Cached Instances**: Lists all currently cached instances

   ```
   [INFO] Cached Instances:
   [DEBUG] • HTTP_CLIENT (HttpClientImpl) - Last used: 10:30:45
   ```

4. **Problem Detection**: Alerts about potential issues like circular dependencies

   ```
   [ERROR] Circular dependency detected: USER_SERVICE -> AUTH_SERVICE -> USER_SERVICE
   ```

5. **Instance Creation Process**: Details how instances are created

   ```
   [DEBUG] Creating instance of USER_SERVICE
   [DEBUG] Dependencies for USER_SERVICE: HTTP_CLIENT, LOGGER
   [DEBUG] Successfully created instance of USER_SERVICE (UserServiceImpl)
   ```

6. **Promise Cache**: Information about promise caching for asynchronous methods
   ```
   [DEBUG] Using cached promise for HTTP_CLIENT.fetchData()
   [DEBUG] Creating new promise for HTTP_CLIENT.fetchData()
   ```

### Dependency Resolution Flow

Debug mode allows visualization of the complete dependency resolution flow:

1. **Circular Dependency Check**: First, checks for circular dependencies
2. **Cache Check**: Checks if the instance already exists in cache
3. **Instance Creation**: If not cached, creates a new instance
4. **Dependency Resolution**: Recursively resolves all required dependencies
5. **Cache Storage**: Stores the instance in cache according to configured lifecycle
6. **Dependency Tracking**: Records dependency relationships for future invalidation

### When to Use Debug Mode

Debug mode is especially useful during:

- Initial application development
- Debugging dependency injection issues
- Performance analysis and optimization
- Understanding dependency resolution flow
- Memory leak identification

**Note**: Debug mode can impact production performance, so it's recommended to use it only in development environments.

## Lifecycles

The container supports three types of lifecycles:

- **singleton**: A single instance is created and reused
- **transient**: A new instance is created for each resolution
- **scoped**: An instance is created per scope (e.g., per HTTP request)

## Complete Example

```typescript
// Define tokens
const HTTP_CLIENT = Symbol("HTTP_CLIENT");
const USER_SERVICE = Symbol("USER_SERVICE");
const API_CONFIG = Symbol("API_CONFIG");

// Create container
const container = new Container({
  providers: [
    {
      provide: API_CONFIG,
      useValue: {
        baseUrl: "https://api.example.com",
        timeout: 5000,
      },
    },
  ],
  debug: true,
});

// Register dependencies
container.register(HTTP_CLIENT, {
  useClass: HttpClient,
  dependencies: [API_CONFIG],
  lifecycle: "singleton",
});

container.register(USER_SERVICE, {
  useClass: UserService,
  dependencies: [HTTP_CLIENT],
  lifecycle: "scoped",
});

// Resolve dependencies
const userService = container.resolve<UserService>(USER_SERVICE);
const users = await userService.getUsers();

// Clean up resources when done
container.clearRequestScope();
```
