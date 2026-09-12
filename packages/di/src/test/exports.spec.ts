import { describe, expect, it } from "vitest";
import * as core from "../core";
import * as root from "../index";
import * as monitorEntry from "../monitor";
import * as otelEntry from "../otel";
import * as react from "../react";

describe("@brushy/di umbrella exports", () => {
  it("should expose core APIs from the root entrypoint", () => {
    expect(root.Container).toBeTypeOf("function");
    expect(root.createToken).toBeTypeOf("function");
    expect(root.inject).toBeDefined();
    expect(root.resolve).toBeDefined();
    expect(root.cache).toBeDefined();
    expect(root.runInRequestScope).toBeTypeOf("function");
    expect(root.monitor).toBeDefined();
    expect(root.ContainerMonitor).toBeTypeOf("function");
  });

  it("should expose react APIs from the root entrypoint", () => {
    expect(root.BrushyDIProvider).toBeDefined();
    expect(root.useInject).toBeTypeOf("function");
    expect(root.useInjectLazy).toBeTypeOf("function");
    expect(root.useInjectComponent).toBeTypeOf("function");
    expect(root.setInjectComponentErrorRenderer).toBeTypeOf("function");
  });

  it("should re-export core subpath entrypoint", () => {
    expect(core.Container).toBe(root.Container);
    expect(core.createToken).toBe(root.createToken);
    expect(core.inject).toBe(root.inject);
  });

  it("should re-export react subpath entrypoint", () => {
    expect(react.BrushyDIProvider).toBe(root.BrushyDIProvider);
    expect(react.useInject).toBe(root.useInject);
    expect(react.useInjectLazy).toBe(root.useInjectLazy);
  });

  it("should re-export monitor subpath entrypoint", () => {
    expect(monitorEntry.monitor).toBe(root.monitor);
    expect(monitorEntry.ContainerMonitor).toBe(root.ContainerMonitor);
  });

  it("should re-export otel subpath entrypoint", () => {
    expect(otelEntry.traceContainer).toBeTypeOf("function");
    expect(otelEntry.traceResolve).toBeTypeOf("function");
  });
});
