# @brushy/di-otel

Part of the [@brushy/di 2.0.0](../di/CHANGELOG.md) umbrella release.

## 2.0.0

First published release of `@brushy/di-otel`.

### Added

- `traceContainer(container, options?)`: wrap container resolve with OpenTelemetry spans.
- `traceResolve(container, token)`: trace a single resolve call.
- Graceful no-op when `@opentelemetry/api` is not installed.
- Peer dependency: `@opentelemetry/api` (optional at runtime).
- Re-exported from `@brushy/di/otel`.

See the [full umbrella changelog](../di/CHANGELOG.md#200) for migration details.
