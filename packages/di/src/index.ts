/**
 * Umbrella entrypoint for `@brushy/di` (core + react + monitor).
 *
 * Re-exports {@link https://www.npmjs.com/package/@brushy/di-core | @brushy/di-core},
 * {@link https://www.npmjs.com/package/@brushy/di-react | @brushy/di-react}, and
 * {@link https://www.npmjs.com/package/@brushy/di-monitor | @brushy/di-monitor}.
 *
 * For OpenTelemetry helpers, use the `@brushy/di/otel` subpath.
 *
 * @example
 * ```ts
 * import { Container, useInject, BrushyDIProvider } from "@brushy/di";
 * ```
 *
 * @packageDocumentation
 */

export type { Lifecycle } from "@brushy/di-core";
export * from "@brushy/di-core";
export { ContainerMonitor, monitor } from "@brushy/di-monitor";
export * from "@brushy/di-react";
