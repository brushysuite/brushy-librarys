# Utilitários para Servidor

O `@brushy/di` fornece utilitários específicos para gerenciar a injeção de dependências no lado do servidor, especialmente útil em aplicações Node.js e frameworks como Next.js, Express, NestJS, etc.

## server

O objeto `server` fornece métodos para gerenciar containers no contexto do servidor.

### Importação

```typescript
import { server } from "@brushy/di";
```

### Configuração do Container do Servidor

```typescript
// Criar container para o servidor
const serverContainer = new Container({
  providers: [
    { provide: "DATABASE", useClass: Database },
    { provide: "LOGGER", useClass: Logger },
    { provide: "CONFIG", useValue: { port: 3000, env: "production" } },
  ],
});

// Configurar como container global do servidor
server.setServerContainer(serverContainer);
```

### Obter o Container do Servidor

```typescript
// Obter o container global do servidor
const container = server.getServerContainer();
```

### Resolução de Dependências

```typescript
// Resolver dependência de forma síncrona
const logger = server.resolve<Logger>("LOGGER");
logger.info("Servidor iniciado");

// Resolver dependência de forma assíncrona
const database = await server.resolveAsync<Database>("DATABASE");
await database.connect();
```

### Limpeza de Escopo de Requisição

Um dos recursos mais importantes para aplicações servidor é a capacidade de limpar o escopo de requisição após cada requisição HTTP, evitando vazamentos de memória e garantindo isolamento entre requisições.

```typescript
// Em um middleware Express
app.use((req, res, next) => {
  // Código do middleware
  next();

  // Limpar escopo de requisição após a resposta ser enviada
  server.clearRequestScope();
});

// Em um middleware Next.js
export function middleware(request: NextRequest) {
  // Código do middleware
  const response = NextResponse.next();

  // Limpar escopo de requisição
  server.clearRequestScope();

  return response;
}

// Em um interceptor NestJS
@Injectable()
export class RequestScopeInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      tap(() => {
        // Limpar escopo de requisição após a resposta ser enviada
        server.clearRequestScope();
      }),
    );
  }
}
```

## Exemplo Completo com Express

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

// Criar container do servidor
const serverContainer = new Container();

// Registrar dependências
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
  lifecycle: "scoped", // Escopo por requisição
});

serverContainer.register(USER_SERVICE, {
  useClass: UserService,
  dependencies: [USER_REPOSITORY, LOGGER],
  lifecycle: "scoped", // Escopo por requisição
});

// Configurar como container do servidor
server.setServerContainer(serverContainer);

// Criar aplicação Express
const app = express();

// Middleware para limpar escopo de requisição
app.use((req, res, next) => {
  next();
  // Após a resposta ser enviada
  res.on("finish", () => {
    server.clearRequestScope();
  });
});

// Rota para obter usuários
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

// Iniciar servidor
const config = server.resolve<{ port: number }>(CONFIG);
app.listen(config.port, () => {
  const logger = server.resolve<Logger>(LOGGER);
  logger.info(`Server running on port ${config.port}`);
});
```

## Exemplo com Next.js App Router

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

// Criar e configurar container apenas uma vez
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
    lifecycle: "scoped", // Escopo por requisição
  });

  server.setServerContainer(container);
  initialized = true;
}

// app/api/users/route.ts
import { NextResponse } from "next/server";
import { server } from "@brushy/di";
import { setupServerContainer, USER_REPOSITORY } from "../di-setup";

export async function GET() {
  // Configurar container
  setupServerContainer();

  try {
    // Resolver repositório
    const userRepository = server.resolve(USER_REPOSITORY);

    // Buscar usuários
    const users = await userRepository.findAll();

    // Limpar escopo de requisição
    server.clearRequestScope();

    return NextResponse.json(users);
  } catch (error) {
    console.error("Failed to get users:", error);

    // Limpar escopo mesmo em caso de erro
    server.clearRequestScope();

    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}
```

## Melhores Práticas

1. **Sempre limpe o escopo de requisição**: Chame `server.clearRequestScope()` após cada requisição HTTP para evitar vazamentos de memória.

2. **Use lifecycle adequado**: Para serviços compartilhados, use `singleton`. Para serviços específicos de requisição, use `scoped`.

3. **Inicialize o container apenas uma vez**: Em aplicações serverless como Next.js, certifique-se de inicializar o container apenas uma vez para evitar sobrecarga.

4. **Gerencie conexões de recursos**: Para recursos como conexões de banco de dados, considere usar o ciclo de vida do container para gerenciar conexões.

5. **Isole escopos de teste**: Durante testes, crie containers isolados para evitar interferência entre testes.
