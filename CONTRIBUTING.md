# Contributing to Brushy Suite

## Development

```bash
npm ci
npm run build-packages
npm run test -- --filter='@brushy/di*'
```

## Packages

| Package | Description |
|---------|-------------|
| `@brushy/di-core` | Zero-dependency DI core |
| `@brushy/di-react` | React / React Native bindings |
| `@brushy/di-monitor` | Optional observability |
| `@brushy/di` | Umbrella re-exports |

## Pull Requests

1. Branch from `main`
2. Run `npm run check-types` and tests locally
3. Add a changeset: `npm run changeset`
4. Keep PRs focused — one concern per PR

## Releases

Releases use [Changesets](https://github.com/changesets/changesets). Maintainers run `npm run version-packages` and `npm run release` after merging.
