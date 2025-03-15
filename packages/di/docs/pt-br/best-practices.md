# Boas Práticas

Este guia apresenta as melhores práticas para utilizar o `@brushy/di` de forma eficiente e organizada.

## Organização de Tokens

### Use Símbolos para Tokens

Prefira usar `Symbol` para tokens em vez de strings, pois eles garantem unicidade e evitam colisões:

```typescript
// ✅ Bom: Usar Symbol
const USER_SERVICE = Symbol("USER_SERVICE");

// ❌ Evite: Usar string
const USER_SERVICE = "USER_SERVICE";
```

### Centralize a Definição de Tokens

Mantenha todos os tokens em um local centralizado:

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

## Ciclo de Vida

### Escolha o Ciclo de Vida Adequado

- Use `singleton` para serviços compartilhados (padrão)
- Use `transient` para instâncias que não devem ser compartilhadas
- Use `scoped` para instâncias que devem ser compartilhadas dentro de um escopo (ex: requisição HTTP)
- Use `immutable` para gerenciadores de estado e instâncias que nunca devem ser invalidadas

```typescript
// Serviço compartilhado
container.register(TOKENS.SERVICES.CONFIG_SERVICE, {
  useClass: ConfigService,
  lifecycle: "singleton", // ou omita, pois é o padrão
});

// Instância única por uso
container.register(TOKENS.SERVICES.FILE_PROCESSOR, {
  useClass: FileProcessor,
  lifecycle: "transient",
});

// Instância por requisição
container.register(TOKENS.SERVICES.REQUEST_CONTEXT, {
  useClass: RequestContext,
  lifecycle: "scoped",
});

// Gerenciadores de estado que nunca devem ser invalidados
container.register(TOKENS.SERVICES.QUERY_CLIENT, {
  useFactory: () => new QueryClient(),
  lifecycle: "immutable",
});
```

### Use Ciclo de Vida Imutável para Gerenciadores de Estado

Ao trabalhar com bibliotecas de gerenciamento de estado como React Query, Redux ou Zustand, use o ciclo de vida `immutable` para garantir que a instância nunca seja invalidada:

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

### Limpe Recursos Adequadamente

```typescript
// Em aplicações web, limpe o escopo de requisição após cada requisição
app.use((req, res, next) => {
  // Processar requisição
  next();
  // Após a resposta ser enviada
  container.clearRequestScope();
});

// Use o coletor de lixo para limpar instâncias não utilizadas
container.startGarbageCollector(60000, 30000);
```

## Estrutura de Aplicação

### Módulos Independentes

Organize sua aplicação em módulos independentes, cada um com seu próprio container:

```typescript
// módulo de usuários
const userModule = new Container();
userModule.register(USER_SERVICE, { useClass: UserService });
userModule.register(USER_REPOSITORY, { useClass: UserRepository });

// módulo de produtos
const productModule = new Container();
productModule.register(PRODUCT_SERVICE, { useClass: ProductService });
productModule.register(PRODUCT_REPOSITORY, { useClass: ProductRepository });

// container principal
const appContainer = new Container();
appContainer.import(userModule, { prefix: "user" });
appContainer.import(productModule, { prefix: "product" });
```

### Injeção em Componentes React

Prefira usar hooks para injeção em componentes React:

```tsx
// ✅ Bom: Usar hooks
function UserList() {
  const userService = useInject(USER_SERVICE);
  // ...
}

// ❌ Evite: Resolver diretamente no componente
function UserList() {
  const userService = container.resolve(USER_SERVICE);
  // ...
}
```

## Performance

### Cache de Promessas

Utilize o cache de promessas para evitar múltiplas chamadas à API:

```typescript
// ✅ Bom: Usar o cache de promessas
function UserProfile({ userId }) {
  const userService = useInject(USER_SERVICE);
  const user = use(userService.getUserById(userId));
  return <div>{user.name}</div>;
}

// ❌ Evite: Criar novas promessas a cada renderização
function UserProfile({ userId }) {
  const userService = useInject(USER_SERVICE);
  const [user, setUser] = useState(null);

  useEffect(() => {
    userService.getUserById(userId).then(setUser);
  }, [userId, userService]);

  if (!user) return <div>Carregando...</div>;
  return <div>{user.name}</div>;
}
```

### Lazy Loading

Use `useLazyInject` para carregar dependências pesadas apenas quando necessário:

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
      <button onClick={generateReport}>Gerar Relatório</button>
    </div>
  );
}
```

## Testabilidade

### Containers de Teste

Crie containers específicos para testes:

```typescript
// container de teste
const testContainer = new Container();
testContainer.register(USER_SERVICE, {
  useClass: MockUserService
});

// componente de teste
function renderWithDI(ui) {
  return render(
    <BrushyDIProvider container={testContainer}>
      {ui}
    </BrushyDIProvider>
  );
}

// teste
test('renders user list', () => {
  renderWithDI(<UserList />);
  // ...
});
```

### Mocks Fáceis

Use `useValue` para injetar mocks em testes:

```typescript
// mock do serviço
const mockUserService = {
  getUsers: jest.fn().mockResolvedValue([
    { id: 1, name: "User 1" },
    { id: 2, name: "User 2" },
  ]),
};

// registrar mock
testContainer.register(USER_SERVICE, {
  useValue: mockUserService,
});
```

## Observabilidade

### Monitore o Container

Use o monitor para depurar problemas:

```typescript
// criar monitor
const containerMonitor = monitor.create(container, {
  eventTypes: ["resolve", "error"],
  logToConsole: true,
});

// analisar eventos após operações
const events = containerMonitor.getEvents();
const stats = containerMonitor.getStats();

console.log(`Taxa de erro: ${stats.errorRate * 100}%`);
console.log(`Taxa de sucesso: ${stats.resolveSuccessRate * 100}%`);
```

### Verificar Integridade Imutável

Use o método `verifyImmutableIntegrity` para garantir que instâncias imutáveis mantenham sua identidade:

```typescript
// Criar uma função verificadora
const verificarIntegridade = container.verifyImmutableIntegrity();

// Verificar integridade em pontos críticos da aplicação
function verificarIntegridadeDoSistema() {
  const queryClientIntacto = verificarIntegridade(QUERY_CLIENT);
  const reduxStoreIntacto = verificarIntegridade(REDUX_STORE);
  
  if (!queryClientIntacto || !reduxStoreIntacto) {
    console.error("Violação de integridade imutável detectada!");
    // Tomar ação apropriada
  }
}
```

### Logging Detalhado

Ative o modo de debug para logging detalhado:

```typescript
const container = new Container({
  debug: true,
  name: "AppContainer",
});
```

## Segurança

### Validação de Dependências

Valide as dependências ao registrá-las:

```typescript
function registrarServico(token, classeServico, dependencias = []) {
  // Verificar se todas as dependências estão registradas
  for (const dep of dependencias) {
    if (!container.registry.has(dep)) {
      throw new Error(`Dependência não registrada: ${String(dep)}`);
    }
  }

  container.register(token, {
    useClass: classeServico,
    dependencies: dependencias,
  });
}
```

### Evite Exposição de Serviços Sensíveis

Não exponha serviços sensíveis diretamente:

```typescript
// ✅ Bom: Expor apenas métodos necessários
container.register(AUTH_SERVICE, {
  useFactory: () => {
    const authService = new AuthService();

    // Retornar apenas métodos públicos
    return {
      login: authService.login.bind(authService),
      logout: authService.logout.bind(authService),
      isAuthenticated: authService.isAuthenticated.bind(authService),
    };
  },
});

// ❌ Evite: Expor o serviço completo
container.register(AUTH_SERVICE, {
  useClass: AuthService,
});
```

## Exemplo de Arquitetura Completa

```
src/
├── di/
│   ├── tokens.ts           # Definição de todos os tokens
│   ├── container.ts        # Configuração do container principal
│   └── modules/            # Módulos DI
│       ├── auth.module.ts
│       ├── user.module.ts
│       └── product.module.ts
├── services/               # Implementações de serviços
│   ├── auth/
│   ├── user/
│   └── product/
├── components/             # Componentes React
│   ├── providers/          # Providers de DI
│   │   └── AppProvider.tsx # Provider principal
│   └── ...
└── hooks/                  # Hooks personalizados
    └── useAuth.ts          # Hook que usa useInject
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

  // Registrar gerenciadores de estado com ciclo de vida imutável
  container.register(TOKENS.STATE.QUERY_CLIENT, {
    useFactory: () => new QueryClient(),
    lifecycle: "immutable"
  });

  // Importar módulos
  container.import(authModule);
  container.import(userModule);
  container.import(productModule);

  // Iniciar coletor de lixo
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

// Configurar container global
inject.setGlobalContainer(appContainer);

export function AppProvider({ children }) {
  // Obter o cliente de consulta imutável
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

    // Inscrever-se em mudanças de autenticação
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
