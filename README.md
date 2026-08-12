# Brushy Suite

<div align="center">
  <p>A high-level library suite for modern JavaScript/TypeScript development</p>
</div>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-blue.svg)](https://www.typescriptlang.org/)
[![Turborepo](https://img.shields.io/badge/Built%20With-Turborepo-blueviolet.svg)](https://turbo.build/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)

## Overview

The Brushy Suite is a collection of high-level libraries for modern JavaScript/TypeScript development. The focus is robust, well-tested tools with intuitive APIs.

## Libraries

### @brushy/di (v2.0.0)

[![npm version](https://img.shields.io/npm/v/@brushy/di.svg)](https://www.npmjs.com/package/@brushy/di)
[![Size](https://img.shields.io/bundlephobia/minzip/@brushy/di)](https://bundlephobia.com/package/@brushy/di)

Flexible dependency injection for Node.js, browsers, React, and React Native. Version 2 splits the ecosystem into focused packages while keeping `@brushy/di` as the umbrella install.

Published packages (`@brushy/di*` have 100% test coverage in CI):

| Package | Role |
| --- | --- |
| `@brushy/di` | Umbrella (core + react + monitor + otel) |
| `@brushy/di-core` | Node, browser, RN without React |
| `@brushy/di-react` | React / React Native hooks |
| `@brushy/di-monitor` | Optional observability |
| `@brushy/di-otel` | Optional OpenTelemetry tracing |

**Docs**

- [Documentation](packages/di/docs/en/README.md)
- [Getting Started](packages/di/docs/en/getting-started.md)
- [Migration v2](packages/di/docs/en/migration-v2.md) (upgrade from 1.x)
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

The monorepo also includes `@brushy/di-bench` (private): Tier 1 comparative benchmarks vs tsyringe, InversifyJS, and awilix. Not published to npm.

### @brushy/localstorage

[![npm version](https://img.shields.io/npm/v/@brushy/localstorage.svg)](https://www.npmjs.com/package/@brushy/localstorage)
[![Size](https://img.shields.io/bundlephobia/minzip/@brushy/localstorage)](https://bundlephobia.com/package/@brushy/localstorage)

TypeScript-friendly local state management. [Documentation](packages/localstorage/docs)

```bash
npm install @brushy/localstorage
```

## Getting Started

```bash
# DI full stack
npm install @brushy/di react

# DI core only (server / RN without hooks)
npm install @brushy/di-core

# Multiple libraries
npm install @brushy/di @brushy/localstorage
```

## Development

```bash
git clone https://github.com/brushysuite/brushy-librarys.git
cd brushy-librarys
npm ci

npm run build-packages
npm run test -- --filter='@brushy/di*'
npm run test:coverage
npm run check-types
npm run publint
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
