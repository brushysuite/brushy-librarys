/**
 * Core-only entrypoint for `@brushy/di`.
 *
 * Re-exports {@link https://www.npmjs.com/package/@brushy/di-core | @brushy/di-core}.
 * Use this subpath when React bindings are not needed (e.g. Node.js servers).
 *
 * @example
 * ```ts
 * import { Container, createToken, server } from "@brushy/di/core";
 * ```
 *
 * @packageDocumentation
 */

export * from "@brushy/di-core";
