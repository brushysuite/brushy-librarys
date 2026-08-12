# @brushy/di-core

Zero-React dependency injection for Node.js, browsers, and React Native.

## Install

```bash
npm install @brushy/di-core
```

## Quick start

```typescript
import { Container, createToken } from "@brushy/di-core";

const LOGGER = createToken<{ log: (msg: string) => void }>("LOGGER");

const container = new Container();
container.register(LOGGER, {
  useValue: { log: console.log },
});

const logger = container.resolve(LOGGER);
logger.log("ready");
```

## Features

- Lifecycles: `singleton`, `transient`, `scoped`, `immutable`
- Typed tokens via `createToken` and `defineModule`
- Request scope with AsyncLocalStorage on Node (`runInRequestScope`)
- Subpath exports: `@brushy/di-core/container`, `/resolve`, `/inject`, `/server`, `/request-scope`

## Docs

Full documentation: https://brushysuite.gfrancodev.com/docs/di
