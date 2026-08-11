---
"@brushy/di": major
"@brushy/di-core": major
"@brushy/di-react": major
"@brushy/di-monitor": major
---

# @brushy/di 2.0.0

## Major changes

- Split into `@brushy/di-core`, `@brushy/di-react`, `@brushy/di-monitor`
- `@brushy/di` remains the umbrella package (installs all sub-packages)
- ESM + CJS dual build via tsup
- Granular entry points: `@brushy/di-core/container`, `/cache`, `/resolve`, `/inject`, `/server`
- Typed tokens: `createToken<T>()`, `defineModule()`
- Automatic type inference in `resolve`, `inject`, `useInject`

## Migration

See `packages/di/docs/en/migration-v2.md` and `packages/di/docs/pt-br/migration-v2.md`.
