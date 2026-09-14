<div align="center">
  <img src="../../apps/docs/apple-touch-icon.png" alt="Brushy Suite" width="128" />
  <h1>@brushy/di-otel</h1>
  <p>OpenTelemetry resolve tracing for Brushy DI</p>
  <br />
  [![npm version](https://img.shields.io/npm/v/@brushy/di-otel.svg)](https://www.npmjs.com/package/@brushy/di-otel)
</div>

OpenTelemetry hooks for resolve tracing in [`@brushy/di-core`](https://www.npmjs.com/package/@brushy/di-core).

Part of the [@brushy/di 2.0](../di/README.md) umbrella release.

## Install

```bash
npm install @brushy/di-otel @brushy/di-core @opentelemetry/api
```

Or use the umbrella package:

```bash
npm install @brushy/di @opentelemetry/api
```

`@opentelemetry/api` is an optional peer dependency. If it is not installed, tracing helpers become no-ops.

## Usage

Wrap a container to trace every `resolve`:

```typescript
import { Container, createToken } from "@brushy/di-core";
import { traceContainer } from "@brushy/di-otel";

const container = new Container();
const LOGGER = container.register(createToken("LOGGER"), {
  useValue: { log: console.log },
});

const restore = traceContainer(container, {
  tracerName: "my-app",
  attributeToken: true,
});

container.resolve(LOGGER);

restore(); // unwrap when done
```

Trace a single resolve:

```typescript
import { traceResolve } from "@brushy/di-otel";

const logger = traceResolve(container, LOGGER);
```

Umbrella import:

```typescript
import { traceContainer } from "@brushy/di/otel";
```

## API

| Export | Description |
| --- | --- |
| `traceContainer(container, options?)` | Patches `container.resolve` with spans; returns restore function |
| `traceResolve(container, token, options?)` | Traces one resolve call |

Options: `tracerName` (default `@brushy/di`), `attributeToken` (add `di.token` attribute).

## Related

- [`@brushy/di-monitor`](../di-monitor/README.md) for in-process event logging
- [`@brushy/di-core`](../di-core/README.md) · [`@brushy/di`](../di/README.md)
- [DI overview](https://brushysuite.gfrancodev.com/di/overview)
- [Changelog](./CHANGELOG.md) · [Umbrella release notes](../di/CHANGELOG.md)
