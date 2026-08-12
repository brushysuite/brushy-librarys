import { describe, expect, it, beforeEach, vi } from "vitest";
import { Container } from "../core/container";
import { containerRegistry } from "../registry";
import { inject } from "./inject";
import { server } from "./server";
import { createToken } from "../types/tokens";

describe("inject facade", () => {
  beforeEach(() => {
    containerRegistry.cleanupTransientScopes();
  });

  it("should throw when global container is missing", () => {
    expect(() => inject.getGlobalContainer()).toThrow(/No global container defined/);
  });

  it("should resolve, resolveAsync and clear request scope from the global container", async () => {
    const container = new Container();
    const TOKEN = container.register(createToken("INJECT"), {
      useValue: "async-value",
    });
    inject.setGlobalContainer(container);

    expect(inject.resolve(TOKEN)).toBe("async-value");
    await expect(inject.resolveAsync(TOKEN)).resolves.toBe("async-value");
    expect(() => inject.clearRequestScope()).not.toThrow();
  });

  it("should optionally clear request scope on process beforeExit", () => {
    const container = new Container();
    const clearSpy = vi.spyOn(container, "clearRequestScope");
    const onSpy = vi.spyOn(process, "on");

    inject.setGlobalContainer(container, { autoCleanRequestScope: true });

    expect(onSpy).toHaveBeenCalledWith("beforeExit", expect.any(Function));
    const handler = onSpy.mock.calls.find(([event]) => event === "beforeExit")?.[1];
    handler?.();
    expect(clearSpy).toHaveBeenCalled();
  });
});

describe("server facade", () => {
  it("should throw when server container is missing", () => {
    expect(() => server.getServerContainer()).toThrow(/No server container defined/);
  });

  it("should resolve, resolveAsync and clear request scope from the server container", async () => {
    const container = new Container();
    const TOKEN = container.register(createToken("SERVER"), {
      useValue: "server-value",
    });
    server.setServerContainer(container);

    expect(server.resolve(TOKEN)).toBe("server-value");
    await expect(server.resolveAsync(TOKEN)).resolves.toBe("server-value");
    expect(() => server.clearRequestScope()).not.toThrow();
  });

  it("should build request scope middleware with the server container", () => {
    const container = new Container();
    server.setServerContainer(container);
    const next = vi.fn();

    const middleware = server.brushyRequestScope();
    middleware({}, {}, next);

    expect(next).toHaveBeenCalled();
  });
});
