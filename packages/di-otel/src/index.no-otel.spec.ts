import { describe, it, expect, vi } from "vitest";
import { Container } from "@brushy/di-core";

vi.mock("node:module", () => ({
  createRequire: () => () => {
    throw new Error("MODULE_NOT_FOUND");
  },
}));

describe("@brushy/di-otel without OpenTelemetry", () => {
  it("should passthrough resolve and return noop restore", async () => {
    const { traceContainer, traceResolve } = await import("./index");

    const container = new Container();
    const TOKEN = container.register("SVC", { useValue: { ok: true } });

    expect(traceResolve(container, TOKEN)).toEqual({ ok: true });

    const restore = traceContainer(container);
    expect(container.resolve(TOKEN)).toEqual({ ok: true });
    restore();
  });
});
