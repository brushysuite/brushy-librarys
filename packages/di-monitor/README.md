<div align="center">
  <img src="../../apps/docs/apple-touch-icon.png" alt="Brushy Suite" width="128" />
  <h1>@brushy/di-monitor</h1>
  <p>Container event monitoring and stats for Brushy DI</p>
  <br />
  [![npm version](https://img.shields.io/npm/v/@brushy/di-monitor.svg)](https://www.npmjs.com/package/@brushy/di-monitor)
</div>

Container monitoring utilities for [`@brushy/di-core`](https://www.npmjs.com/package/@brushy/di-core). Observe register, resolve, and error events with optional console logging and stats.

Part of the [@brushy/di 2.0](../di/README.md) umbrella.

## Install

```bash
npm install @brushy/di-monitor @brushy/di-core
```

Or use the umbrella package:

```bash
npm install @brushy/di
```

## Usage

```typescript
import { Container, createToken } from "@brushy/di-core";
import { monitor } from "@brushy/di-monitor";

const container = new Container();
const API = container.register(createToken("API"), { useValue: {} });

const containerMonitor = monitor.create(container, {
  logToConsole: true,
  eventTypes: ["register", "resolve", "error"],
  maxEvents: 100,
});

container.resolve(API);

console.log(containerMonitor.getStats());
console.log(containerMonitor.getEvents());

containerMonitor.stop();
```

Umbrella import:

```typescript
import { monitor } from "@brushy/di/monitor";
```

## API

| Export | Description |
| --- | --- |
| `monitor.create(container, options?)` | Returns a `ContainerMonitor` instance |
| `ContainerMonitor` | Observes container events |

### `ContainerMonitor` methods

| Method | Description |
| --- | --- |
| `start()` | Begin observing (called automatically on create) |
| `stop()` | Unsubscribe from container events |
| `getEvents()` | Copy of captured events |
| `getStats()` | Totals, counts by type, error rate, resolve success rate |
| `clearHistory()` | Reset captured events |

### `MonitorOptions`

| Option | Default | Description |
| --- | --- | --- |
| `eventTypes` | `["all"]` | Filter: `register`, `resolve`, `error`, or `all` |
| `logToConsole` | `true` | Log events to `console.info` |
| `maxEvents` | `100` | Ring buffer size for event history |

## Related

- [`@brushy/di-core`](../di-core/README.md) · [`@brushy/di`](../di/README.md)

## Docs

- [Monitor overview](https://brushysuite.gfrancodev.com/di/monitor/overview)
- [API reference](https://brushysuite.gfrancodev.com/di/monitor/api-reference)
