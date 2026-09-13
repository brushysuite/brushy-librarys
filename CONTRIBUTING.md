# Contributing to Brushy Suite

## Development

```bash
npm ci
npm run build-packages
npm run lint
npm run test -- --filter='@brushy/di*' --filter='@brushy/storage*'
```

Lint and format use [Biome](https://biomejs.dev/) at the repo root:

```bash
npm run lint        # check lint + format
npm run lint:fix    # auto-fix safe issues
npm run format      # format all files
```

## Packages

| Package | Description |
|---------|-------------|
| `@brushy/di-core` | Zero-dependency DI core |
| `@brushy/di-react` | React / React Native bindings |
| `@brushy/di-monitor` | Optional observability |
| `@brushy/di-otel` | Optional OpenTelemetry tracing |
| `@brushy/di` | Umbrella re-exports (core + react + monitor + otel) |
| `@brushy/storage` | Isomorphic cache (`@brushy/localstorage` is deprecated) |
| `@brushy/storage-react` | React hooks for `@brushy/storage` |

## Examples

The [`examples/`](examples/README.md) folder contains private demo apps (`@brushy-examples/*`). They are not published to npm. Run `npm run build-packages` before trying an example.

## Pull Requests

1. Branch from `main`
2. Run `npm run check-types` and tests locally
3. Add a changeset: `npm run changeset`
4. Keep PRs focused - one concern per PR

## Releases

Releases use [Changesets](https://github.com/changesets/changesets). After merging a PR with changesets to `main`, the [Release workflow](.github/workflows/release.yml) opens or updates a **Version Packages** PR. Merge that PR to bump versions and publish to npm (uses the `NPM_TOKEN` repository secret).

Local commands (for debugging only):

- `npm run version-packages` — apply pending changesets
- `npm run release` — build and publish (requires npm auth)
