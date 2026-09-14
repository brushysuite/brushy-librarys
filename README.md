<div align="center">
  <img src="apps/docs/apple-touch-icon.png" alt="Brushy Suite" width="128" />
  <h1>Brushy Suite</h1>
  <p>A high-level library suite for modern JavaScript/TypeScript development</p>
  <br />
  [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
  [![Turborepo](https://img.shields.io/badge/Built%20With-Turborepo-blueviolet.svg)](https://turbo.build/)
  [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
</div>

## Overview

The Brushy Suite is a collection of high-level libraries for modern JavaScript/TypeScript development. The focus is robust, well-tested tools with intuitive APIs.

**Documentation:** [brushysuite.gfrancodev.com](https://brushysuite.gfrancodev.com) · [GitHub](https://github.com/brushysuite/brushy-librarys)

## Libraries

### @brushy/di (v2.0.0)

[![npm version](https://img.shields.io/npm/v/@brushy/di.svg)](https://www.npmjs.com/package/@brushy/di)
[![Size](https://img.shields.io/bundlephobia/minzip/@brushy/di)](https://bundlephobia.com/package/@brushy/di)

Flexible dependency injection for Node.js, browsers, React, and React Native. Version 2 splits the ecosystem into focused packages while keeping `@brushy/di` as the umbrella install.

Published packages (`@brushy/di*` have 100% test coverage in CI):

| Package | Role |
| --- | --- |
| [`@brushy/di`](https://www.npmjs.com/package/@brushy/di) | Umbrella (core + react + monitor + otel) |
| [`@brushy/di-core`](https://www.npmjs.com/package/@brushy/di-core) | Node, browser, RN without React |
| [`@brushy/di-react`](https://www.npmjs.com/package/@brushy/di-react) | React / React Native hooks |
| [`@brushy/di-monitor`](https://www.npmjs.com/package/@brushy/di-monitor) | Optional observability |
| [`@brushy/di-otel`](https://www.npmjs.com/package/@brushy/di-otel) | Optional OpenTelemetry tracing |

**Docs**

- [Documentation site](https://brushysuite.gfrancodev.com)
- [Getting Started](https://brushysuite.gfrancodev.com/getting-started/introduction)
- [DI overview](https://brushysuite.gfrancodev.com/di/overview)
- [Migration v2](https://brushysuite.gfrancodev.com/di/migration-v2) (upgrade from 1.x)
- [DI benchmarks](https://brushysuite.gfrancodev.com/di/benchmarks)
- [CHANGELOG](packages/di/CHANGELOG.md) (full release notes)
- [Package README](packages/di/README.md) (examples, benchmark)

**Install**

```bash
npm install @brushy/di

# or pick packages
npm install @brushy/di-core @brushy/di-react
```

**Quick import (v2)**

```typescript
import { Container } from '@brushy/di/core';
import { useInject, BrushyDIProvider } from '@brushy/di/react';
```

`@brushy/di-bench` (private) provides Tier 1 comparative benchmarks vs tsyringe, InversifyJS, and awilix. Published results: [DI benchmarks](https://brushysuite.gfrancodev.com/di/benchmarks) · [`packages/di-bench/results/BENCHMARK.md`](packages/di-bench/results/BENCHMARK.md) (updated by CI).

### @brushy/storage (v2.0.0)

[![npm version](https://img.shields.io/npm/v/@brushy/storage.svg)](https://www.npmjs.com/package/@brushy/storage)

Isomorphic cache primitive for the Brushy suite: NodeCache DX on the server, optional `localStorage` persist on the web. React hooks: [`@brushy/storage-react`](https://www.npmjs.com/package/@brushy/storage-react).

```bash
npm install @brushy/storage
npm install @brushy/storage-react react
```

See [packages/storage/README.md](packages/storage/README.md) · [Storage docs](https://brushysuite.gfrancodev.com/storage/overview). [`@brushy/localstorage`](https://www.npmjs.com/package/@brushy/localstorage) is **deprecated** — migrate via [storage migration guide](https://brushysuite.gfrancodev.com/storage/migration).

## Examples

Runnable demos for Vite, Expo, Express, and Fastify: [examples overview](https://brushysuite.gfrancodev.com/examples/overview) · [`examples/`](examples/README.md). They show recommended DI patterns (`createToken`, `Container`, request scope, React hooks).

```bash
npm run build-packages
npm run example:vite      # http://localhost:5173
npm run example:express   # http://localhost:3001/users
npm run example:fastify   # http://localhost:3002/users
npm run example:expo      # manual (Expo Go / simulator)
```

## Getting Started

```bash
# DI full stack
npm install @brushy/di react

# DI core only (server / RN without hooks)
npm install @brushy/di-core

# Multiple libraries
npm install @brushy/di @brushy/storage
```

## Development

```bash
git clone https://github.com/brushysuite/brushy-librarys.git
cd brushy-librarys
pnpm install --frozen-lockfile

pnpm run build-packages
pnpm run test
pnpm run test:coverage
pnpm run check-types
pnpm run publint
```

See [Contributing](CONTRIBUTING.md) for pull requests and releases.

## Contributing

Contributions are welcome. The [Contributing Guide](CONTRIBUTING.md) covers:

- Development workflow
- Pull requests and changesets
- Releases via [Changesets](https://github.com/changesets/changesets)

## Security

Report vulnerabilities as described in [SECURITY.md](SECURITY.md).

## License

MIT. See [LICENSE](LICENSE).

## Acknowledgments

Thanks to everyone who contributed to the Brushy Suite.

---

<div align="center">
  <strong>Built with care by the Brushy Team</strong>
</div>
