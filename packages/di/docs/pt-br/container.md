# Container

O `Container` é o componente central do sistema de injeção de dependências. Ele é responsável por registrar, resolver e gerenciar o ciclo de vida das dependências.

## Importação

```typescript
import { Container } from "@brushy/di";
```

## Criação de um Container

```typescript
// Container básico
const container = new Container();

// Container com providers iniciais
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

### Registro de Dependências

```typescript
// Registro de uma classe
container.register("USER_SERVICE", {
  useClass: UserService,
  dependencies: ["HTTP_CLIENT", "LOGGER"],
});

// Registro de um valor
container.register("API_URL", {
  useValue: "https://api.example.com",
});

// Registro de uma factory
container.register("DATABASE", {
  useFactory: () => createDatabaseConnection(),
  lifecycle: "singleton",
});
```

### Resolução de Dependências

```typescript
// Resolução síncrona
const userService = container.resolve<UserService>("USER_SERVICE");

// Resolução assíncrona
const database = await container.resolveAsync<Database>("DATABASE");
```

### Gerenciamento de Ciclo de Vida

```typescript
// Limpar escopo de requisição
container.clearRequestScope();

// Iniciar coletor de lixo
container.startGarbageCollector(60000, 30000);

// Parar coletor de lixo
container.stopGarbageCollector();

// Invalidar cache de uma dependência
container.invalidateCache("USER_SERVICE");
```

### Integração com React

```typescript
// Obter uma promessa cacheada para uso com o hook 'use'
const data = use(container.getPromise("HTTP_CLIENT", "fetchData", ["/users"]));
```

### Observabilidade

```typescript
// Observar eventos do container
const unsubscribe = container.observe((event) => {
  console.log(`Evento: ${event.type}`, event);
});

// Parar de observar
unsubscribe();
```

### Importação/Exportação

```typescript
// Importar providers de outro container
container.import(otherContainer, {
  prefix: "other",
  overrideExisting: false,
});

// Exportar providers
const providers = container.exportProviders();
```

## Modo de Debug

O Container possui um poderoso modo de debug que permite visualizar detalhadamente o processo de resolução de dependências. Quando ativado, ele exibe logs coloridos no console que mostram:

- Registro de dependências
- Resolução de dependências
- Grafo de dependências
- Instâncias em cache
- Erros e problemas de resolução
- Ciclos de vida das instâncias

### Ativando o Modo Debug

```typescript
// Ao criar o container
const container = new Container({
  debug: true,
  name: "AppContainer",
});

// Exemplo de saída de log
// [DEBUG] Resolved USER_SERVICE (UserServiceImpl) synchronously
// [DEBUG] Dependencies for USER_SERVICE: HTTP_CLIENT, LOGGER
// [INFO] Dependency Relationships:
// [DEBUG] • HTTP_CLIENT (HttpClientImpl) ← Used by: USER_SERVICE (UserServiceImpl)
// [DEBUG] • LOGGER (ConsoleLogger) ← Used by: USER_SERVICE (UserServiceImpl)
```

### Sistema de Logging

O modo debug utiliza um sistema de logging interno com formatação colorida para facilitar a visualização:

- **INFO** (verde): Informações gerais e títulos de seções
- **DEBUG** (ciano): Detalhes sobre resolução e registro de dependências
- **WARN** (amarelo): Avisos sobre possíveis problemas
- **ERROR** (vermelho): Erros críticos como dependências circulares

Além disso, o logger utiliza cores específicas para diferentes tipos de informação:

- **Tokens** (magenta): Identificadores de dependências
- **Classes** (amarelo brilhante): Nomes de implementações
- **Lifecycle** (ciano brilhante): Tipos de ciclo de vida

```typescript
// Exemplo de saída colorida (representada textualmente)
[INFO] Registered Tokens:
[DEBUG] • USER_SERVICE: UserServiceImpl (singleton)
[DEBUG] • HTTP_CLIENT: HttpClientImpl (singleton)
[DEBUG] • LOGGER: ConsoleLogger (transient)

[ERROR] Circular dependency detected: AUTH_SERVICE -> USER_SERVICE -> AUTH_SERVICE
```

> **Nota**: O sistema de logging possui um mecanismo inteligente para prevenir mensagens duplicadas. Mensagens idênticas emitidas em um intervalo menor que 200ms são automaticamente suprimidas, evitando poluição do console durante operações repetitivas ou em loops.

### Informações Exibidas no Debug

O modo debug exibe informações detalhadas sobre:

1. **Resolução de Dependências**: Mostra quando e como cada dependência é resolvida

   ```
   [DEBUG] Resolved USER_SERVICE (UserServiceImpl) synchronously
   ```

2. **Grafo de Dependências**: Exibe o grafo completo de dependências após a primeira resolução

   ```
   [INFO] Dependency Relationships:
   [DEBUG] • HTTP_CLIENT (HttpClientImpl) ← Used by: USER_SERVICE (UserServiceImpl)
   ```

3. **Instâncias em Cache**: Lista todas as instâncias atualmente em cache

   ```
   [INFO] Cached Instances:
   [DEBUG] • HTTP_CLIENT (HttpClientImpl) - Last used: 10:30:45
   ```

4. **Detecção de Problemas**: Alerta sobre possíveis problemas como dependências circulares

   ```
   [ERROR] Circular dependency detected: USER_SERVICE -> AUTH_SERVICE -> USER_SERVICE
   ```

5. **Processo de Criação de Instâncias**: Detalha como as instâncias são criadas

   ```
   [DEBUG] Creating instance of USER_SERVICE
   [DEBUG] Dependencies for USER_SERVICE: HTTP_CLIENT, LOGGER
   [DEBUG] Successfully created instance of USER_SERVICE (UserServiceImpl)
   ```

6. **Cache de Promessas**: Informações sobre o cache de promessas para métodos assíncronos
   ```
   [DEBUG] Using cached promise for HTTP_CLIENT.fetchData()
   [DEBUG] Creating new promise for HTTP_CLIENT.fetchData()
   ```

### Fluxo de Resolução de Dependências

O modo debug permite visualizar o fluxo completo de resolução de dependências:

1. **Verificação de Dependência Circular**: Primeiro, verifica se há dependências circulares
2. **Verificação de Cache**: Verifica se a instância já existe no cache
3. **Criação de Instância**: Se não estiver em cache, cria uma nova instância
4. **Resolução de Dependências**: Resolve recursivamente todas as dependências necessárias
5. **Armazenamento em Cache**: Armazena a instância no cache conforme o ciclo de vida configurado
6. **Rastreamento de Dependências**: Registra as relações de dependência para invalidação futura

### Quando Usar o Modo Debug

O modo debug é especialmente útil durante:

- Desenvolvimento inicial da aplicação
- Depuração de problemas de injeção de dependências
- Análise de performance e otimização
- Entendimento do fluxo de resolução de dependências
- Identificação de vazamentos de memória

**Nota**: O modo debug pode impactar a performance em produção, portanto é recomendado utilizá-lo apenas em ambientes de desenvolvimento.

## Ciclos de Vida

O container suporta três tipos de ciclo de vida:

- **singleton**: Uma única instância é criada e reutilizada
- **transient**: Uma nova instância é criada a cada resolução
- **scoped**: Uma instância é criada por escopo (ex: por requisição HTTP)

## Exemplo Completo

```typescript
// Definir tokens
const HTTP_CLIENT = Symbol("HTTP_CLIENT");
const USER_SERVICE = Symbol("USER_SERVICE");
const API_CONFIG = Symbol("API_CONFIG");

// Criar container
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

// Registrar dependências
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

// Resolver dependências
const userService = container.resolve<UserService>(USER_SERVICE);
const users = await userService.getUsers();

// Limpar recursos ao finalizar
container.clearRequestScope();
```
