import { describe, it, expect, vi } from "vitest";
import { Container } from "@brushy/di-core";
import { traceResolve } from "./index";

describe("@brushy/di-otel", () => {
  it("should resolve without otel installed", () => {
    const container = new Container();
    container.register("SVC", { useValue: { ok: true } });

    const svc = traceResolve(container, "SVC");
    expect(svc.ok).toBe(true);
  });
});
