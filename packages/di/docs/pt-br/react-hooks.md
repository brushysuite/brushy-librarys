# Hooks React

O `@brushy/di` fornece hooks React para facilitar a injeção de dependências em componentes funcionais.

## useInject

O hook `useInject` permite injetar dependências em componentes React.

### Importação

```typescript
import { useInject } from "@brushy/di";
```

### Uso Básico

```typescript
function UserList() {
  // Injetar o serviço de usuários
  const userService = useInject<UserService>('USER_SERVICE');

  // Usar o serviço
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

### Opções

```typescript
// Com opções
const userService = useInject<UserService>("USER_SERVICE", {
  // Desativar cache de promessas
  cachePromises: false,

  // Usar um escopo específico
  scope: requestScope,
});
```

### Cache de Promessas

Por padrão, o `useInject` cria um proxy em torno do serviço injetado que automaticamente cacheia promessas retornadas pelos métodos. Isso é útil para evitar múltiplas chamadas à API durante re-renderizações.

```typescript
function UserProfile({ userId }) {
  const userService = useInject<UserService>('USER_SERVICE');

  // Esta promessa será cacheada automaticamente
  const user = use(userService.getUserById(userId));

  return <div>{user.name}</div>;
}
```

## useLazyInject

O hook `useLazyInject` permite carregar dependências sob demanda, útil para otimização de performance.

### Importação

```typescript
import { useLazyInject } from "@brushy/di";
```

### Uso Básico

```typescript
function ReportGenerator() {
  // O serviço só será carregado quando necessário
  const [reportService, loadReportService] = useLazyInject<ReportService>('REPORT_SERVICE');
  const [report, setReport] = useState(null);

  const generateReport = async () => {
    // Carregar o serviço sob demanda
    loadReportService();

    if (reportService) {
      const data = await reportService.generate();
      setReport(data);
    }
  };

  return (
    <div>
      <button onClick={generateReport}>Gerar Relatório</button>
      {report && <ReportViewer data={report} />}
    </div>
  );
}
```

### Opções

```typescript
// Com opções
const [reportService, loadReportService] = useLazyInject<ReportService>(
  "REPORT_SERVICE",
  {
    scope: requestScope,
  },
);
```

## Integração com o Provider

Para que os hooks funcionem, é necessário envolver a aplicação com o `BrushyDIProvider`:

```tsx
import { Container, BrushyDIProvider } from "@brushy/di";

// Criar o container
const container = new Container({
  providers: [
    // ... configuração de providers
  ],
});

// Aplicação com provider
function App() {
  return (
    <BrushyDIProvider container={container}>
      <YourApp />
    </BrushyDIProvider>
  );
}
```

## Exemplo Completo

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

// Serviços
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

// Componente
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
      <h1>Usuários</h1>
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
