# @brushy/di

<div align="center">

[![Coverage - Statements](https://img.shields.io/badge/Coverage%20Statements-99.5%25-brightgreen.svg)](coverage)
[![Coverage - Branches](https://img.shields.io/badge/Coverage%20Branches-98.73%25-brightgreen.svg)](coverage)
[![Coverage - Functions](https://img.shields.io/badge/Coverage%20Functions-100%25-brightgreen.svg)](coverage)
[![Coverage - Lines](https://img.shields.io/badge/Coverage%20Lines-99.5%25-brightgreen.svg)](coverage)

<!-- Package Stats -->

[![npm downloads](https://img.shields.io/npm/dm/@brushy/di.svg)](https://www.npmjs.com/package/@brushy/di)
[![npm bundle size](https://img.shields.io/bundlephobia/minzip/@brushy/di)](https://bundlephobia.com/package/@brushy/di)
[![npm version](https://img.shields.io/npm/v/@brushy/di.svg)](https://www.npmjs.com/package/@brushy/di)

</div>

A powerful and flexible dependency injection system for JavaScript/TypeScript applications, with special support for React.

[🇧🇷 Documentação em Português](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/pt-br/README.md) | [🇺🇸 English Documentation](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/README.md)

## Features

- 🔄 **Flexible Lifecycle**: Singleton, Transient and Scoped
- 🧩 **React Component Injection**: Seamless React integration
- 🔍 **Observability**: Detailed monitoring and logging
- 🚀 **Performance**: Smart promise caching
- 🧪 **Testability**: Easy to mock for testing
- 📦 **Modular**: Organization in independent modules

## Installation

```bash
npm install @brushy/di
# or
yarn add @brushy/di
# or
pnpm add @brushy/di
```

## Real-World Problem Solving

Here's how @brushy/di compares to other solutions in solving common real-world problems:

| Problem                 | @brushy/di                                  | tsyringe                 | InversifyJS              | Angular DI                |
| ----------------------- | ------------------------------------------- | ------------------------ | ------------------------ | ------------------------- |
| **React Integration**   | ✅ Native support with hooks and components | ⚠️ Requires manual setup | ❌ Limited React support | ❌ Not designed for React |
| **Server Components**   | ✅ Full RSC compatibility                   | ❌ Not compatible        | ❌ Not compatible        | ❌ Not applicable         |
| **Promise Caching**     | ✅ Automatic smart caching                  | ⚠️ Manual implementation | ⚠️ Manual implementation | ⚠️ Manual implementation  |
| **Component Injection** | ✅ Built-in UI component system             | ❌ No UI support         | ❌ No UI support         | ⚠️ Different paradigm     |
| **Learning Curve**      | ✅ Moderate                                 | ✅ Moderate              | ❌ Steep                 | ❌ Steep                  |
| **Scope Management**    | ✅ Built-in request/session scopes          | ❌ No scope support      | ⚠️ Basic scopes          | ✅ Built-in scopes        |
| **Performance**         | ✅ Optimized resolution                     | ✅ Fast resolution       | ⚠️ Moderate              | ❌ Heavy runtime          |

Legend:

- ✅ Fully Supported
- ⚠️ Partially Supported
- ❌ Not Supported/Limited

## Basic Usage

```typescript
import { Container, BrushyDIProvider, useInject, useInjectComponent } from '@brushy/di';

// Define tokens
const TOKENS = {
  SERVICES: {
    HTTP: Symbol('HTTP_CLIENT'),
    USER: Symbol('USER_SERVICE'),
    AUTH: Symbol('AUTH_SERVICE')
  },
  CONFIG: Symbol('CONFIG'),
  UI: {
    BUTTON: Symbol('BUTTON'),
    CARD: Symbol('CARD'),
    THEME: Symbol('THEME')
  }
};

// Services
class HttpClient {
  async fetch(url: string) {
    const response = await fetch(url);
    return response.json();
  }
}

class UserService {
  constructor(private http: HttpClient) {}

  async getUsers() {
    return this.http.fetch('/api/users');
  }

  async getUserById(id: string) {
    return this.http.fetch(`/api/users/${id}`);
  }
}

class AuthService {
  constructor(
    private http: HttpClient,
    private config: { apiUrl: string }
  ) {}

  async login(credentials: { username: string; password: string }) {
    return this.http.fetch('/api/auth/login');
  }
}

// UI Components
const DefaultButton = ({ children, variant = 'default', ...props }) => (
  <button className={`btn btn-${variant}`} {...props}>
    {children}
  </button>
);

const DefaultCard = ({ title, children }) => (
  <div className="card">
    <div className="card-header">{title}</div>
    <div className="card-body">{children}</div>
  </div>
);

const DefaultTheme = ({ children }) => (
  <div className="light-theme">{children}</div>
);

// Create container with initial configuration
const container = new Container({
  providers: [
    // Register configuration
    {
      provide: TOKENS.CONFIG,
      useValue: {
        apiUrl: 'https://api.example.com',
        timeout: 5000
      }
    },
    // Register HTTP client as singleton
    {
      provide: TOKENS.SERVICES.HTTP,
      useClass: HttpClient,
      lifecycle: 'singleton'
    },
    // Register services with dependencies
    {
      provide: TOKENS.SERVICES.USER,
      useClass: UserService,
      dependencies: [TOKENS.SERVICES.HTTP],
      lifecycle: 'scoped' // New instance per request
    },
    {
      provide: TOKENS.SERVICES.AUTH,
      useClass: AuthService,
      dependencies: [TOKENS.SERVICES.HTTP, TOKENS.CONFIG],
      lifecycle: 'singleton'
    },
    // Register default UI components
    {
      provide: TOKENS.UI.BUTTON,
      useValue: DefaultButton
    },
    {
      provide: TOKENS.UI.CARD,
      useValue: DefaultCard
    },
    {
      provide: TOKENS.UI.THEME,
      useValue: DefaultTheme
    }
  ],
  debug: true,
  name: 'AppContainer'
});

// React Components
function UserList() {
  const userService = useInject<UserService>(TOKENS.SERVICES.USER);
  const Button = useInjectComponent(TOKENS.UI.BUTTON);
  const Card = useInjectComponent(TOKENS.UI.CARD);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    userService.getUsers().then(setUsers);
  }, [userService]);

  return (
    <Card title="Users">
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.name}
            <Button variant="link" onClick={() => console.log(user)}>
              View Details
            </Button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

function LoginForm() {
  const authService = useInject<AuthService>(TOKENS.SERVICES.AUTH);
  const Button = useInjectComponent(TOKENS.UI.BUTTON);
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await authService.login(credentials);
      // Handle success
    } catch (error) {
      // Handle error
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Button type="submit" variant="primary">Login</Button>
    </form>
  );
}

// Custom theme implementation
const DarkTheme = ({ children }) => (
  <div className="dark-theme">{children}</div>
);

// Theme provider to override default theme
const CustomThemeProvider = createComponentsProvider({
  [TOKENS.UI.THEME]: DarkTheme
});

// Application with providers
function App() {
  const Theme = useInjectComponent(TOKENS.UI.THEME);

  return (
    <BrushyDIProvider container={container}>
      <CustomThemeProvider>
        <Theme>
          <div>
            <LoginForm />
            <UserList />
          </div>
        </Theme>
      </CustomThemeProvider>
    </BrushyDIProvider>
  );
}

// Clean up when done
container.clearRequestScope();
```

## Documentation

Complete documentation is available in multiple languages:

### English

- [Introduction and Basic Concepts](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/README.md)
- [Container](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/container.md)
- [React Hooks](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/react-hooks.md)
- [Component Injection](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/component-injection.md)
- [Utility Functions](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/utilities.md)
- [Best Practices](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/en/best-practices.md)

### Portuguese (Brasil)

- [Introdução e Conceitos Básicos](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/pt-br/README.md)
- [Container](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/container.md)
- [Hooks React](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/react-hooks.md)
- [Injeção de Componentes](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/component-injection.md)
- [Funções Utilitárias](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/utilities.md)
- [Boas Práticas](https://github.com/brushysuite/brushy-librarys/blob/main/packages/di/docs/best-practices.md)

To view the documentation locally:

```bash
npm run docs
```

## Common Use Cases

1. **Modular React Applications**

   ```typescript
   // Easy module registration
   const userModule = new Container();
   userModule.register(USER_SERVICE, { useClass: UserService });
   container.import(userModule, { prefix: "user" });
   ```

2. **Server-Side Rendering**

   ```typescript
   // Automatic request scope cleanup
   app.use((req, res, next) => {
     next();
     container.clearRequestScope();
   });
   ```

3. **Component Theming**

   ```typescript
   // Simple component overriding
   const CustomUIProvider = createComponentsProvider({
     [BUTTON]: CustomButton,
     [THEME]: DarkTheme,
   });
   ```

4. **API Integration**
   ```typescript
   // Smart promise caching
   function UserProfile({ id }) {
     const userService = useInject(USER_SERVICE);
     const user = use(userService.getUser(id)); // Cached automatically
     return <div>{user.name}</div>;
   }
   ```

## License

MIT
