# Primeiros passos

Este guia ajuda a escolher os pacotes certos e a ordem de setup em um projeto novo. Express, Fastify, Next.js e React Native usam os mesmos entrypoints: `@brushy/di/core` no servidor e `@brushy/di/react` no client.

Veja também: [Migração v2](./migration-v2.md) · [Server](./server.md) · [Boas práticas](./best-practices.md)

## Regra rápida

1. Escolha o **runtime** (web, mobile, server, full stack).
2. Instale o **pacote mínimo**.
3. Adicione pacotes **opcionais** só se precisar (`monitor`, `otel`).

## Qual pacote instalar primeiro

Copie o comando do seu stack.

**Full stack / Next.js**

```bash
npm install @brushy/di next react react-dom
```

**React web**

```bash
npm install @brushy/di react react-dom
```

Instalação granular (sem umbrella):

```bash
npm install @brushy/di-core @brushy/di-react react react-dom
```

**React Native**

```bash
npm install @brushy/di react
```

Instalação granular:

```bash
npm install @brushy/di-core @brushy/di-react react
```

**Express**

```bash
npm install @brushy/di-core express
```

**Fastify**

```bash
npm install @brushy/di-core fastify
```

**Script / worker / biblioteca (sem React)**

```bash
npm install @brushy/di-core
```

**API + frontend React no mesmo monorepo**

```bash
npm install @brushy/di-core @brushy/di-react express react react-dom
```

**Observabilidade (opcional)**

```bash
npm install @brushy/di-monitor @brushy/di-otel
```

### Pacotes publicados (v2)

**Umbrella (core, react, monitor e otel)**

```bash
npm install @brushy/di
```

**Core (Node, browser e RN, sem hooks React)**

```bash
npm install @brushy/di-core
```

**React (web e React Native)**

```bash
npm install @brushy/di-react
```

**Monitor**

```bash
npm install @brushy/di-monitor
```

**OpenTelemetry**

```bash
npm install @brushy/di-otel
```

### Imports (umbrella)

```typescript
import { Container } from "@brushy/di/core";
import { useInject, BrushyDIProvider } from "@brushy/di/react";
import { monitor } from "@brushy/di/monitor";
import { traceContainer } from "@brushy/di/otel";
```

## Imports por runtime

**Express, Fastify, Nest, API routes**

```typescript
import { Container, createToken, server, runInRequestScope } from "@brushy/di/core";

app.use(server.brushyRequestScope());
```

**Next.js Route Handlers / RSC**

```typescript
import { Container, runInRequestScopeAsync, server } from "@brushy/di/core";
```

**React web, React Native, Next client**

```typescript
import { BrushyDIProvider, useInject } from "@brushy/di/react";
```

**Full stack (umbrella)**

```typescript
import { Container, useInject, BrushyDIProvider } from "@brushy/di";
```

Veja [ADR 004](../adr/README.md#adr-004-framework-integration-via-core-and-react) para a rationale do split de pacotes.

---

## Receitas por stack

### React web

```bash
npm install @brushy/di react react-dom
```

```tsx
// di/container.ts
import { Container, createToken } from "@brushy/di/core";

export const container = new Container();
export const USER_SERVICE = container.register(createToken<UserService>("USER_SERVICE"), {
  useClass: UserService,
  lifecycle: "singleton",
});
```

```tsx
// app/providers.tsx
"use client";
import { BrushyDIProvider } from "@brushy/di/react";
import { container } from "./di/container";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <BrushyDIProvider container={container}>{children}</BrushyDIProvider>;
}
```

```tsx
// components/profile.tsx
import { useInject } from "@brushy/di/react";
import { USER_SERVICE } from "../di/container";

export function Profile() {
  const users = useInject(USER_SERVICE);
  // ...
}
```

Próximo: [React Hooks](./react-hooks.md)

### React Native

Mesmo install e provider do web. O Metro resolve o campo `react-native` automaticamente.

```bash
npm install @brushy/di react
```

```tsx
import { BrushyDIProvider, useInject } from "@brushy/di/react";
import { Container, createToken } from "@brushy/di/core";
```

**Importante:** Em dev, `useInjectComponent` exibe UI de erro com elementos DOM no web. No React Native, registre um renderer de plataforma no bootstrap (senão a UI fica `null` e os erros continuam em `console.error`):

```tsx
import { Text, View } from "react-native";
import { setInjectComponentErrorRenderer } from "@brushy/di/react";

setInjectComponentErrorRenderer((message, details) => (
  <View>
    <Text>{message}</Text>
    {details ? <Text>{details}</Text> : null}
  </View>
));
```

Próximo: [Injeção de componentes](./component-injection.md)

### Express

```bash
npm install @brushy/di-core express
```

```typescript
import express from "express";
import { Container, createToken, server } from "@brushy/di/core";

const USER_SERVICE = createToken<UserService>("USER_SERVICE");
const container = new Container();
container.register(USER_SERVICE, { useClass: UserService, lifecycle: "scoped" });

server.setServerContainer(container);

const app = express();
app.use(server.brushyRequestScope());

app.get("/users", (_req, res) => {
  const users = server.resolve(USER_SERVICE);
  res.json(users.list());
});

app.listen(3000);
```

Próximo: [Utilitários para servidor](./server.md)

### Fastify

Fastify não é compatível com Connect. Envolva cada request com `runInRequestScope`:

```bash
npm install @brushy/di-core fastify
```

```typescript
import Fastify from "fastify";
import { Container, createToken, runInRequestScope } from "@brushy/di/core";

const USER_SERVICE = createToken<UserService>("USER_SERVICE");
const container = new Container();
container.register(USER_SERVICE, { useClass: UserService, lifecycle: "scoped" });

const app = Fastify();

app.get("/users", async (_req, reply) => {
  const users = runInRequestScope(
    () => container.resolve(USER_SERVICE),
    { container },
  );
  return reply.send(users.list());
});
```

Em produção, prefira `runInRequestScopeAsync` em handlers async. Padrões completos: [Utilitários para servidor](./server.md).

### Next.js (App Router)

```bash
npm install @brushy/di next react react-dom
```

**Client Components**

```typescript
import { BrushyDIProvider, useInject } from "@brushy/di/react";
```

**Route Handlers / server**

```typescript
import { Container, runInRequestScopeAsync, server } from "@brushy/di/core";
```

**React Server Components**

```typescript
import { Container, createToken } from "@brushy/di/core";
// resolve no servidor: sem hooks React
```

```typescript
// lib/di-setup.ts - singleton no módulo (inicializar uma vez)
import { Container, createToken, server } from "@brushy/di/core";

let initialized = false;
export const USER_REPO = createToken<UserRepository>("USER_REPO");

export function setupServerContainer() {
  if (initialized) return;
  const container = new Container();
  container.register(USER_REPO, { useClass: UserRepository, lifecycle: "scoped" });
  server.setServerContainer(container);
  initialized = true;
}
```

```typescript
// app/api/users/route.ts
import { NextResponse } from "next/server";
import { runInRequestScopeAsync, server } from "@brushy/di/core";
import { setupServerContainer, USER_REPO } from "@/lib/di-setup";

export async function GET() {
  setupServerContainer();
  const users = await runInRequestScopeAsync(
    () => server.resolve(USER_REPO).findAll(),
    { container: server.getServerContainer() },
  );
  return NextResponse.json(users);
}
```

```tsx
// app/providers.tsx
"use client";
import { BrushyDIProvider } from "@brushy/di/react";
import { clientContainer } from "@/lib/client-container";

export function Providers({ children }: { children: React.ReactNode }) {
  return <BrushyDIProvider container={clientContainer}>{children}</BrushyDIProvider>;
}
```

**Não** dependa do middleware Edge do Next.js para request scope ALS em Route Handlers - vincule o scope **dentro** do handler com `runInRequestScopeAsync`.

Próximo: [Server - exemplo App Router Next.js](./server.md#exemplo-com-nextjs-app-router)

### Só backend (sem React)

```bash
npm install @brushy/di-core
```

```typescript
import { Container, createToken } from "@brushy/di/core";

const LOGGER = createToken<Logger>("LOGGER");
const container = new Container();
container.register(LOGGER, { useClass: Logger, lifecycle: "singleton" });

const logger = container.resolve(LOGGER);
logger.info("ready");
```

---

## Add-ons opcionais

Instale só quando precisar:

```bash
npm install @brushy/di-monitor   # métricas / hooks de logging
npm install @brushy/di-otel      # tracing OpenTelemetry
```

## Próximos passos

- [Container](./container.md) - registro e lifecycles
- [Server](./server.md) - request scope, Express, Next.js
- [Boas práticas](./best-practices.md) - tokens, scopes, testes
- [Migração v2](./migration-v2.md) - split de pacotes e imports
