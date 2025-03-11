# Server Utilities

`@brushy/di` provides specific utilities for managing dependency injection on the server side, especially useful in Node.js applications and frameworks like Next.js, Express, NestJS, etc.

## server

The `server` object provides methods for managing containers in the server context.

### Import

```typescript
import { server } from "@brushy/di";
```

### Server Container Configuration

```typescript
// Create server container
const serverContainer = new Container({
  providers: [
    { provide: "DATABASE", useClass: Database },
    { provide: "LOGGER", useClass: Logger },
    { provide: "CONFIG", useValue: { port: 3000, env: "production" } },
  ],
});

// Configure as global server container
server.setServerContainer(serverContainer);
```

### Get Server Container

```typescript
// Get global server container
const container = server.getServerContainer();
```

### Dependency Resolution

```typescript
// Resolve dependency synchronously
const logger = server.resolve<Logger>("LOGGER");
logger.info("Server started");

// Resolve dependency asynchronously
const database = await server.resolveAsync<Database>("DATABASE");
await database.connect();
```

### Request Scope Cleanup

One of the most important features for server applications is the ability to clean up the request scope after each HTTP request, preventing memory leaks and ensuring isolation between requests.

```typescript
// In an Express middleware
app.use((req, res, next) => {
  // Middleware code
  next();

  // Clean up request scope after response is sent
  server.clearRequestScope();
});

// In a Next.js middleware
export function middleware(request: NextRequest) {
  // Middleware code
  const response = NextResponse.next();

  // Clean up request scope
  server.clearRequestScope();

  return response;
}

// In a NestJS interceptor
@Injectable()
export class RequestScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        // Clean up request scope after response is sent
        server.clearRequestScope();
      }),
    );
  }
}
```

## Complete Example with Express

```typescript
import express from "express";
import { Container, server } from "@brushy/di";

// Tokens
const LOGGER = "LOGGER";
const CONFIG = "CONFIG";
const USER_REPOSITORY = "USER_REPOSITORY";
const USER_SERVICE = "USER_SERVICE";

// Classes
class Logger {
  info(message: string) {
    console.log(`[INFO] ${message}`);
  }

  error(message: string, error?: any) {
    console.error(`[ERROR] ${message}`, error);
  }
}

class UserRepository {
  constructor(private logger: Logger) {}

  async findAll() {
    this.logger.info("Finding all users");
    return [
      { id: 1, name: "John" },
      { id: 2, name: "Jane" },
    ];
  }
}

class UserService {
  constructor(
    private repository: UserRepository,
    private logger: Logger,
  ) {}

  async getUsers() {
    this.logger.info("Getting users from service");
    return this.repository.findAll();
  }
}

// Create server container
const serverContainer = new Container();

// Register dependencies
serverContainer.register(LOGGER, {
  useClass: Logger,
  lifecycle: "singleton",
});

serverContainer.register(CONFIG, {
  useValue: { port: 3000 },
});

serverContainer.register(USER_REPOSITORY, {
  useClass: UserRepository,
  dependencies: [LOGGER],
  lifecycle: "scoped", // Request scope
});

serverContainer.register(USER_SERVICE, {
  useClass: UserService,
  dependencies: [USER_REPOSITORY, LOGGER],
  lifecycle: "scoped", // Request scope
});

// Configure as server container
server.setServerContainer(serverContainer);

// Create Express application
const app = express();

// Middleware to clean up request scope
app.use((req, res, next) => {
  next();
  // After response is sent
  res.on("finish", () => {
    server.clearRequestScope();
  });
});

// Route to get users
app.get("/users", async (req, res) => {
  try {
    const userService = server.resolve<UserService>(USER_SERVICE);
    const users = await userService.getUsers();
    res.json(users);
  } catch (error) {
    const logger = server.resolve<Logger>(LOGGER);
    logger.error("Failed to get users", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
const config = server.resolve<{ port: number }>(CONFIG);
app.listen(config.port, () => {
  const logger = server.resolve<Logger>(LOGGER);
  logger.info(`Server running on port ${config.port}`);
});
```

## Example with Next.js App Router

```typescript
// app/api/di-setup.ts
import { Container, server } from "@brushy/di";

// Tokens
export const DATABASE = "DATABASE";
export const USER_REPOSITORY = "USER_REPOSITORY";

// Classes
class Database {
  async connect() {
    console.log("Connecting to database...");
    return true;
  }

  async query(sql: string) {
    console.log(`Executing query: ${sql}`);
    return [{ id: 1, name: "John" }];
  }
}

class UserRepository {
  constructor(private db: Database) {}

  async findAll() {
    return this.db.query("SELECT * FROM users");
  }
}

// Create and configure container only once
let initialized = false;

export function setupServerContainer() {
  if (initialized) return;

  const container = new Container();

  container.register(DATABASE, {
    useClass: Database,
    lifecycle: "singleton",
  });

  container.register(USER_REPOSITORY, {
    useClass: UserRepository,
    dependencies: [DATABASE],
    lifecycle: "scoped", // Request scope
  });

  server.setServerContainer(container);
  initialized = true;
}

// app/api/users/route.ts
import { NextResponse } from "next/server";
import { server } from "@brushy/di";
import { setupServerContainer, USER_REPOSITORY } from "../di-setup";

export async function GET() {
  // Configure container
  setupServerContainer();

  try {
    // Resolve repository
    const userRepository = server.resolve(USER_REPOSITORY);

    // Fetch users
    const users = await userRepository.findAll();

    // Clean up request scope
    server.clearRequestScope();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to get users:", error);

    // Clean up scope even in case of error
    server.clearRequestScope();

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
```

## Best Practices

1. **Always clean up request scope**: Call `server.clearRequestScope()` after each HTTP request to prevent memory leaks.

2. **Use appropriate lifecycle**: For shared services, use `singleton`. For request-specific services, use `scoped`.

3. **Initialize container only once**: In serverless applications like Next.js, make sure to initialize the container only once to avoid overhead.

4. **Manage resource connections**: For resources like database connections, consider using the container lifecycle to manage connections.

5. **Isolate test scopes**: During testing, create isolated containers to avoid interference between tests.
