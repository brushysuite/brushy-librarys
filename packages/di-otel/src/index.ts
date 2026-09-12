import { createRequire } from "node:module";
import type { Container, Token } from "@brushy/di-core";

export interface OtelTraceOptions {
  tracerName?: string;
  attributeToken?: boolean;
}

type SpanLike = {
  setAttribute: (key: string, value: string) => void;
  setStatus?: (status: { code: number; message?: string }) => void;
  recordException?: (error: unknown) => void;
  end: () => void;
};

type TracerLike = {
  startSpan: (name: string) => SpanLike;
};

type OtelApi = {
  trace: { getTracer: (name: string) => TracerLike };
  SpanStatusCode?: { ERROR: number };
};

const require = createRequire(import.meta.url);

function recordSpanError(span: SpanLike, otel: OtelApi, error: unknown): void {
  span.recordException?.(error);
  span.setStatus?.({
    code: otel.SpanStatusCode?.ERROR ?? 2,
    message: error instanceof Error ? error.message : String(error),
  });
}

function runWithSpan<T>(span: SpanLike, otel: OtelApi, resolve: () => T): T {
  let failed = false;
  let failure: unknown;
  let value!: T;

  try {
    value = resolve();
  } catch (error) {
    failed = true;
    failure = error;
    recordSpanError(span, otel, error);
  }

  span.end();

  if (failed) throw failure;
  return value;
}

export function traceContainer(container: Container, options: OtelTraceOptions = {}): () => void {
  const otel = loadOtelApi();
  if (!otel) return () => {};

  const tracer = otel.trace.getTracer(options.tracerName ?? "@brushy/di");
  const containerWithResolve = container as Container & {
    resolve: Container["resolve"];
  };
  const originalResolve = containerWithResolve.resolve.bind(container);

  containerWithResolve.resolve = (<T>(token: Token): T => {
    const span = tracer.startSpan("di.resolve");
    if (options.attributeToken) {
      span.setAttribute("di.token", String(token));
    }

    return runWithSpan(span, otel, () => originalResolve<T>(token));
  }) as Container["resolve"];

  return () => {
    containerWithResolve.resolve = originalResolve;
  };
}

function loadOtelApi(): OtelApi | null {
  try {
    return require("@opentelemetry/api") as OtelApi;
  } catch {
    return null;
  }
}

export function traceResolve<T>(container: Container, token: Token, options?: OtelTraceOptions): T {
  const otel = loadOtelApi();
  if (!otel) return container.resolve(token);

  const tracer = otel.trace.getTracer(options?.tracerName ?? "@brushy/di");
  const span = tracer.startSpan("di.resolve");
  if (options?.attributeToken) span.setAttribute("di.token", String(token));

  return runWithSpan(span, otel, () => container.resolve(token));
}
