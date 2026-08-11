import { createRequire } from "node:module";
import type { Container, ContainerObserver, Token } from "@brushy/di-core";

export interface OtelTraceOptions {
  tracerName?: string;
  attributeToken?: boolean;
}

type SpanLike = {
  setAttribute: (key: string, value: string) => void;
  end: () => void;
};

type TracerLike = {
  startSpan: (name: string) => SpanLike;
};

type OtelApi = {
  trace: { getTracer: (name: string) => TracerLike };
};

const require = createRequire(import.meta.url);

export function traceContainer(
  container: Container,
  options: OtelTraceOptions = {},
): () => void {
  const otel = loadOtelApi();
  if (!otel) return () => {};

  const tracer = otel.trace.getTracer(options.tracerName ?? "@brushy/di");
  const observer: ContainerObserver = (event) => {
    if (event.type !== "resolve" || !event.token) return;

    const span = tracer.startSpan("di.resolve");
    if (options.attributeToken) {
      span.setAttribute("di.token", String(event.token));
    }
    span.end();
  };

  return container.observe(observer);
}

function loadOtelApi(): OtelApi | null {
  try {
    return require("@opentelemetry/api") as OtelApi;
  } catch {
    return null;
  }
}

export function traceResolve<T>(
  container: Container,
  token: Token,
  options?: OtelTraceOptions,
): T {
  const otel = loadOtelApi();
  if (!otel) return container.resolve(token);

  const tracer = otel.trace.getTracer(options?.tracerName ?? "@brushy/di");
  const span = tracer.startSpan("di.resolve");
  if (options?.attributeToken) span.setAttribute("di.token", String(token));

  try {
    return container.resolve(token);
  } finally {
    span.end();
  }
}
