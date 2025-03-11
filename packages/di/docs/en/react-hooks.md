# React Hooks

`@brushy/di` provides React hooks to facilitate dependency injection in functional components.

## useInject

The `useInject` hook allows injecting dependencies into React components.

### Import

```typescript
import { useInject } from "@brushy/di";
```

### Basic Usage

```typescript
function UserList() {
  // Inject the user service
  const userService = useInject<UserService>('USER_SERVICE');

  // Use the service
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getUsers().then(setUsers);
  }, [userService]);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}
```

### Options

```typescript
// With options
const userService = useInject<UserService>("USER_SERVICE", {
  // Disable promise caching
  cachePromises: false,

  // Use a specific scope
  scope: requestScope,
});
```

### Promise Caching

By default, `useInject` creates a proxy around the injected service that automatically caches promises returned by methods. This is useful to avoid multiple API calls during re-renders.

```typescript
function UserProfile({ userId }) {
  const userService = useInject<UserService>('USER_SERVICE');

  // This promise will be automatically cached
  const user = use(userService.getUserById(userId));

  return <div>{user.name}</div>;
}
```

## useLazyInject

The `useLazyInject` hook allows loading dependencies on demand, useful for performance optimization.

### Import

```typescript
import { useLazyInject } from "@brushy/di";
```

### Basic Usage

```typescript
function ReportGenerator() {
  // The service will only be loaded when needed
  const [reportService, loadReportService] = useLazyInject<ReportService>('REPORT_SERVICE');
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    // Load the service on demand
    loadReportService();

    if (reportService) {
      const data = await reportService.generate();
      setReport(data);
    }
  };

  return (
    <div>
      <button onClick={generateReport}>Generate Report</button>
      {report && <ReportViewer data={report} />}
    </div>
  );
}
```

### Options

```typescript
// With options
const [reportService, loadReportService] = useLazyInject<ReportService>(
  "REPORT_SERVICE",
  {
    scope: requestScope,
  },
);
```

## Provider Integration

For the hooks to work, you need to wrap your application with `BrushyDIProvider`:

```tsx
import { Container, BrushyDIProvider } from "@brushy/di";

// Create the container
const container = new Container({
  providers: [
    // ... provider configuration
  ],
});

// Application with provider
function App() {
  return (
    <BrushyDIProvider container={container}>
      <YourApp />
    </BrushyDIProvider>
  );
}
```

## Complete Example

```tsx
import {
  Container,
  BrushyDIProvider,
  useInject,
  useLazyInject,
} from "@brushy/di";
import { useState, useEffect } from "react";

// Tokens
const USER_SERVICE = Symbol("USER_SERVICE");
const ANALYTICS_SERVICE = Symbol("ANALYTICS_SERVICE");

// Services
class UserService {
  async getUsers() {
    return fetch("/api/users").then((r) => r.json());
  }
}

class AnalyticsService {
  trackEvent(name, data) {
    console.log(`Event: ${name}`, data);
  }
}

// Container
const container = new Container();
container.register(USER_SERVICE, { useClass: UserService });
container.register(ANALYTICS_SERVICE, { useClass: AnalyticsService });

// Component
function UserList() {
  const userService = useInject<UserService>(USER_SERVICE);
  const [analyticsService, loadAnalytics] =
    useLazyInject<AnalyticsService>(ANALYTICS_SERVICE);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getUsers().then(setUsers);
  }, [userService]);

  const trackClick = () => {
    loadAnalytics();
    if (analyticsService) {
      analyticsService.trackEvent("user_list_clicked", { count: users.length });
    }
  };

  return (
    <div onClick={trackClick}>
      <h1>Users</h1>
      <ul>
        {users.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}

// App
export default function App() {
  return (
    <BrushyDIProvider container={container}>
      <UserList />
    </BrushyDIProvider>
  );
}
```
