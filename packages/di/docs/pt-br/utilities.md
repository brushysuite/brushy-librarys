# Funções Utilitárias

O `@brushy/di` fornece várias funções utilitárias para facilitar o uso do sistema de injeção de dependências em diferentes contextos.

## resolve

A função `resolve` permite resolver dependências de forma global, sem precisar acessar diretamente o container.

### Importação

```typescript
import { resolve } from "@brushy/di";
```

### Uso Básico

```typescript
// Resolver uma dependência
const userService = resolve<UserService>("USER_SERVICE");

// Usar a dependência
const users = await userService.getUsers();
```

### Com Escopo

```typescript
// Resolver uma dependência com escopo específico
const requestService = resolve<RequestService>("REQUEST_SERVICE", requestScope);
```

## inject

O objeto `inject` fornece utilitários para injeção de dependências em qualquer contexto.

### Importação

```typescript
import { inject } from "@brushy/di";
```

### Configuração do Container Global

```typescript
// Criar container
const container = new Container();

// Configurar como container global
inject.setGlobalContainer(container, {
  autoCleanRequestScope: true,
});
```

### Resolução de Dependências

```typescript
// Obter o container global
const container = inject.getGlobalContainer();

// Resolver dependência
const userService = inject.resolve<UserService>("USER_SERVICE");

// Resolver dependência assíncrona
const database = await inject.resolveAsync<Database>("DATABASE");

// Limpar escopo de requisição
inject.clearRequestScope();
```

## cache

O objeto `cache` fornece utilitários para gerenciar o cache de promessas.

### Importação

```typescript
import { cache } from "@brushy/di";
```

### Limpar Cache

```typescript
// Limpar todo o cache de promessas
cache.clear();

// Limpar cache para um token específico
cache.clear("USER_SERVICE");
```

## monitor

O objeto `monitor` fornece utilitários para monitorar e observar o comportamento do container.

### Importação

```typescript
import { monitor } from "@brushy/di";
```

### Criar Monitor

```typescript
// Criar um monitor para um container
const containerMonitor = monitor.create(container, {
  eventTypes: ["resolve", "error"],
  logToConsole: true,
  maxEvents: 100,
});

// Obter eventos registrados
const events = containerMonitor.getEvents();

// Obter estatísticas
const stats = containerMonitor.getStats();
console.log(`Taxa de erro: ${stats.errorRate * 100}%`);

// Parar monitoramento
containerMonitor.stop();

// Limpar histórico
containerMonitor.clearHistory();
```

## BrushyDIProvider

O componente `BrushyDIProvider` é usado para fornecer um container DI para componentes React.

### Importação

```typescript
import { BrushyDIProvider } from "@brushy/di";
```

### Uso Básico

```tsx
// Criar container
const container = new Container();

// Fornecer container para a aplicação
function App() {
  return (
    <BrushyDIProvider container={container}>
      <YourApp />
    </BrushyDIProvider>
  );
}
```

### Com Escopo

```tsx
// Criar escopo para a requisição atual
const requestScope = {};

// Fornecer container com escopo
function App() {
  return (
    <BrushyDIProvider container={container} scope={requestScope}>
      <YourApp />
    </BrushyDIProvider>
  );
}
```

## Exemplo Completo

```typescript
import {
  Container,
  BrushyDIProvider,
  resolve,
  inject,
  cache,
  monitor
} from '@brushy/di';

// Tokens
const LOGGER = Symbol('LOGGER');
const API_CLIENT = Symbol('API_CLIENT');
const USER_SERVICE = Symbol('USER_SERVICE');

// Classes
class Logger {
  log(message: string) {
    console.log(`[LOG] ${message}`);
  }
}

class ApiClient {
  constructor(private baseUrl: string) {}

  async get(path: string) {
    return fetch(`${this.baseUrl}${path}`).then(r => r.json());
  }
}

class UserService {
  constructor(
    private apiClient: ApiClient,
    private logger: Logger
  ) {}

  async getUsers() {
    this.logger.log('Fetching users');
    return this.apiClient.get('/users');
  }
}

// Criar container
const container = new Container();

// Registrar dependências
container.register(LOGGER, { useClass: Logger });
container.register(API_CLIENT, {
  useFactory: () => new ApiClient('https://api.example.com'),
  lifecycle: 'singleton'
});
container.register(USER_SERVICE, {
  useClass: UserService,
  dependencies: [API_CLIENT, LOGGER]
});

// Configurar container global
inject.setGlobalContainer(container);

// Criar monitor
const containerMonitor = monitor.create(container, {
  eventTypes: ['all'],
  logToConsole: true
});

// Função que usa resolução global
async function fetchUsers() {
  try {
    const userService = resolve<UserService>(USER_SERVICE);
    return await userService.getUsers();
  } catch (error) {
    console.error('Failed to fetch users:', error);
    return [];
  } finally {
    // Limpar cache após uso
    cache.clear(USER_SERVICE);
  }
}

// Componente React
function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchUsers().then(setUsers);

    // Limpar recursos ao desmontar
    return () => {
      inject.clearRequestScope();
    };
  }, []);

  return (
    <ul>
      {users.map(user => (
        <li key={user.id}>{user.name}</li>
      ))}
    </ul>
  );
}

// Aplicação
function App() {
  return (
    <BrushyDIProvider container={container}>
      <div>
        <h1>Usuários</h1>
        <UserList />
      </div>
    </BrushyDIProvider>
  );
}
```
