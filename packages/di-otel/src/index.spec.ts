import { Container } from "@brushy/di-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { traceContainer, traceResolve } from "./index";

const span = {
  setAttribute: vi.fn(),
  setStatus: vi.fn(),
  recordException: vi.fn(),
  end: vi.fn(),
};

const tracer = {
  startSpan: vi.fn(() => span),
};

const otelApi = {
  trace: {
    getTracer: vi.fn(() => tracer),
  },
  SpanStatusCode: { ERROR: 2 },
};

vi.mock("node:module", () => ({
  createRequire: () => (id: string) => {
    if (id === "@opentelemetry/api") return otelApi;
    throw new Error(`Cannot find module '${id}'`);
  },
}));

describe("@brushy/di-otel", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should trace resolve with span attributes and cleanup", () => {
    const container = new Container();
    const TOKEN = container.register("SVC", { useValue: { ok: true } });

    const restore = traceContainer(container, {
      tracerName: "test-tracer",
      attributeToken: true,
    });

    expect(container.resolve(TOKEN)).toEqual({ ok: true });
    expect(tracer.startSpan).toHaveBeenCalledWith("di.resolve");
    expect(span.setAttribute).toHaveBeenCalledWith("di.token", String(TOKEN));
    expect(span.end).toHaveBeenCalled();

    restore();
    expect(container.resolve(TOKEN)).toEqual({ ok: true });
  });

  it("should record span errors for failing resolves", () => {
    const container = new Container();
    const MISSING = Symbol("MISSING");

    expect(() => traceResolve(container, MISSING, { attributeToken: true })).toThrow(
      /Token not registered/,
    );
    expect(span.recordException).toHaveBeenCalled();
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: expect.stringContaining("Token not registered"),
    });
    expect(span.end).toHaveBeenCalled();
  });

  it("should trace container resolve without token attribute", () => {
    const container = new Container();
    const TOKEN = container.register("SVC", { useValue: 1 });

    traceContainer(container);
    expect(container.resolve(TOKEN)).toBe(1);
    expect(span.setAttribute).not.toHaveBeenCalled();
    expect(span.end).toHaveBeenCalled();
  });

  it("should end spans after successful traceResolve", () => {
    const container = new Container();
    const TOKEN = container.register("SVC", { useValue: 42 });

    expect(traceResolve(container, TOKEN)).toBe(42);
    expect(span.end).toHaveBeenCalled();
  });

  it("should honor custom tracer names", () => {
    const container = new Container();
    const TOKEN = container.register("SVC", { useValue: 1 });

    traceResolve(container, TOKEN, { tracerName: "custom-tracer" });
    expect(otelApi.trace.getTracer).toHaveBeenCalledWith("custom-tracer");
  });

  it("should use SpanStatusCode.ERROR when provided", () => {
    const previousStatusCode = otelApi.SpanStatusCode;
    otelApi.SpanStatusCode = { ERROR: 13 };

    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw new Error("explicit status");
      },
    });

    expect(() => traceResolve(container, BROKEN)).toThrow("explicit status");
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 13,
      message: "explicit status",
    });

    otelApi.SpanStatusCode = previousStatusCode;
  });

  it("should trace container errors and restore resolve", () => {
    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw new Error("boom");
      },
    });

    const restore = traceContainer(container);
    expect(() => container.resolve(BROKEN)).toThrow("boom");
    expect(span.recordException).toHaveBeenCalled();
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "boom",
    });

    restore();
  });

  it("should resolve without token attribute when attributeToken is false", () => {
    const container = new Container();
    const TOKEN = container.register("SVC", { useValue: 1 });

    traceResolve(container, TOKEN);

    expect(span.setAttribute).not.toHaveBeenCalled();
  });

  it("should stringify non-Error resolve failures", () => {
    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw "plain failure";
      },
    });

    expect(() => traceResolve(container, BROKEN)).toThrow();
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "plain failure",
    });
  });

  it("should tolerate minimal span implementations without optional hooks", () => {
    const minimalSpan = {
      setAttribute: vi.fn(),
      end: vi.fn(),
    };
    tracer.startSpan.mockReturnValueOnce(minimalSpan as typeof span);

    const container = new Container();
    const MISSING = Symbol("MISSING");

    expect(() => traceResolve(container, MISSING)).toThrow(/Token not registered/);
    expect(minimalSpan.end).toHaveBeenCalled();

    tracer.startSpan.mockReturnValueOnce(minimalSpan as typeof span);
    traceContainer(container);
    expect(() => container.resolve(MISSING)).toThrow(/Token not registered/);
    expect(minimalSpan.end).toHaveBeenCalledTimes(2);
  });

  it("should default error status code when SpanStatusCode is missing", () => {
    const previousStatusCode = otelApi.SpanStatusCode;
    delete (otelApi as { SpanStatusCode?: { ERROR: number } }).SpanStatusCode;

    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw new Error("status fallback");
      },
    });

    expect(() => traceResolve(container, BROKEN)).toThrow("status fallback");
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "status fallback",
    });

    otelApi.SpanStatusCode = previousStatusCode;
  });

  it("should default error status code in traceContainer when SpanStatusCode is missing", () => {
    const previousStatusCode = otelApi.SpanStatusCode;
    delete (otelApi as { SpanStatusCode?: { ERROR: number } }).SpanStatusCode;

    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw new Error("container fallback");
      },
    });

    traceContainer(container);
    expect(() => container.resolve(BROKEN)).toThrow("container fallback");
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "container fallback",
    });

    otelApi.SpanStatusCode = previousStatusCode;
  });

  it("should stringify non-Error failures in traceContainer", () => {
    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw "container plain failure";
      },
    });

    traceContainer(container);
    expect(() => container.resolve(BROKEN)).toThrow();
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "container plain failure",
    });
  });

  it("should fall back when SpanStatusCode.ERROR is undefined", () => {
    const previousStatusCode = otelApi.SpanStatusCode;
    otelApi.SpanStatusCode = {} as { ERROR: number };

    const container = new Container();
    const BROKEN = container.register("BROKEN", {
      useFactory: () => {
        throw new Error("missing error code");
      },
    });

    expect(() => traceResolve(container, BROKEN)).toThrow("missing error code");
    expect(span.setStatus).toHaveBeenCalledWith({
      code: 2,
      message: "missing error code",
    });

    otelApi.SpanStatusCode = previousStatusCode;
  });
});
