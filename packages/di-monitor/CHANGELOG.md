# @brushy/di-monitor

Part of the [@brushy/di 2.0.0](../di/CHANGELOG.md) umbrella release.

## 2.0.0

First published release of `@brushy/di-monitor`.

### Added

- Optional container monitoring: `monitor.create(container, options)`.
- Subscribe to register/resolve/error events; `getStats()` and `stop()`.
- Re-exported from `@brushy/di` and `@brushy/di/monitor` for backward-compatible umbrella imports.

### Breaking

- Monitor utilities moved out of the v1 monolithic `@brushy/di` package. Install `@brushy/di-monitor` or use `@brushy/di/monitor`.

See the [full umbrella changelog](../di/CHANGELOG.md#200) for migration details.
