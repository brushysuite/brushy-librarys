# @brushy/di-monitor

Container monitoring utilities for [@brushy/di-core](https://www.npmjs.com/package/@brushy/di-core).

## Install

```bash
npm install @brushy/di-monitor @brushy/di-core
```

## Usage

```typescript
import { Container } from "@brushy/di-core";
import { monitor } from "@brushy/di-monitor";

const container = new Container();
const containerMonitor = monitor.create(container, {
  logToConsole: true,
  eventTypes: ["register", "resolve", "error"],
});

container.register("API", { useValue: {} });
container.resolve("API");

console.log(containerMonitor.getStats());
containerMonitor.stop();
```

For backward compatibility, `monitor` is also re-exported from `@brushy/di`.
