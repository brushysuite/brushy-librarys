import { describe, it, expect, beforeEach } from "vitest";
import { Container } from "../core/container";
import { inject } from "./inject";
import { resolve } from "./resolve";
import { containerRegistry } from "../registry";

describe("facades", () => {
  beforeEach(() => {
    containerRegistry.cleanupTransientScopes();
  });

  it("resolve uses global container", () => {
    const container = new Container();
    containerRegistry.setDefaultContainer(container);
    container.register("TOKEN", { useValue: 42 });
    expect(resolve("TOKEN")).toBe(42);
  });

  it("inject.getGlobalContainer returns default container", () => {
    const container = new Container();
    containerRegistry.setDefaultContainer(container);
    expect(inject.getGlobalContainer()).toBe(container);
  });

  it("inject.resolve delegates to global container", () => {
    const container = new Container();
    containerRegistry.setDefaultContainer(container);
    container.register("X", { useValue: "ok" });
    expect(inject.resolve("X")).toBe("ok");
  });
});
