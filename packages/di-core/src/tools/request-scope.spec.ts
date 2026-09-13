import { afterEach, describe, expect, it, vi } from "vitest";
import { Container } from "../core/container";
import { containerRegistry } from "../registry";
import { createToken } from "../types/tokens";
import {
  brushyRequestScope,
  getActiveScope,
  isRequestScopeSupported,
  runInRequestScope,
  runInRequestScopeAsync,
} from "./request-scope";
import * as requestScopeStore from "./request-scope-store";
import { resolve } from "./resolve";

describe("request-scope", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should report ALS support on Node", () => {
    expect(isRequestScopeSupported()).toBe(true);
  });

  it("should expose active scope inside runInRequestScope", () => {
    let captured: object | undefined;

    runInRequestScope(() => {
      captured = getActiveScope();
    });

    expect(captured).toBeDefined();
    expect(getActiveScope()).toBeUndefined();
  });

  it("should isolate resolve context between scopes", () => {
    const container = new Container();
    containerRegistry.setDefaultContainer(container);

    const COUNTER = createToken<{ value: number }>("COUNTER");
    container.register(COUNTER, {
      useFactory: () => ({ value: 0 }),
      lifecycle: "scoped",
    });

    let a = 0;
    let b = 0;

    runInRequestScope(
      () => {
        a = resolve(COUNTER).value;
        resolve(COUNTER).value = 1;
      },
      { container },
    );

    runInRequestScope(
      () => {
        b = resolve(COUNTER).value;
      },
      { container },
    );

    expect(a).toBe(0);
    expect(b).toBe(0);
  });

  it("should isolate concurrent scopes without cross-clearing", async () => {
    const container = new Container();
    containerRegistry.setDefaultContainer(container);

    const COUNTER = createToken<{ value: number }>("CONCURRENT_COUNTER");
    container.register(COUNTER, {
      useFactory: () => ({ value: 0 }),
      lifecycle: "scoped",
    });

    const results: number[] = [];

    await Promise.all([
      runInRequestScopeAsync(
        async () => {
          resolve(COUNTER).value = 1;
          await new Promise((r) => setTimeout(r, 10));
          results.push(resolve(COUNTER).value);
        },
        { container },
      ),
      runInRequestScopeAsync(
        async () => {
          resolve(COUNTER).value = 2;
          await new Promise((r) => setTimeout(r, 5));
          results.push(resolve(COUNTER).value);
        },
        { container },
      ),
    ]);

    expect(results).toContain(1);
    expect(results).toContain(2);
  });

  it("should run async callbacks inside request scope", async () => {
    let captured: object | undefined;

    await runInRequestScopeAsync(async () => {
      captured = getActiveScope();
    });

    expect(captured).toBeDefined();
  });

  it("brushyRequestScope should clear request scope on finish", () => {
    const container = new Container();
    const clearSpy = vi.spyOn(container, "clearRequestScope");

    const middleware = brushyRequestScope({ container });
    const finishHandlers: Array<() => void> = [];

    const res = {
      on: (event: string, fn: () => void) => {
        if (event === "finish") finishHandlers.push(fn);
      },
    };

    let nextCalled = false;
    middleware({}, res, () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
    expect(clearSpy).not.toHaveBeenCalled();

    finishHandlers.forEach((fn) => fn());
    expect(clearSpy).toHaveBeenCalled();
  });

  it("should use a custom cleanup callback when provided", () => {
    const onCleanup = vi.fn();

    runInRequestScope(() => undefined, {
      onCleanup,
      skipRequestScopeCleanup: false,
    });

    expect(onCleanup).toHaveBeenCalled();
  });

  it("should call next directly when request scope is unsupported", () => {
    vi.spyOn(requestScopeStore, "isRequestScopeSupported").mockReturnValue(false);

    const next = vi.fn();
    brushyRequestScope({})({}, {}, next);

    expect(next).toHaveBeenCalled();
  });

  it("should cleanup after runInRequestScope when ALS is unsupported", () => {
    vi.spyOn(requestScopeStore, "isRequestScopeSupported").mockReturnValue(false);
    const onCleanup = vi.fn();

    const value = runInRequestScope(() => "done", { onCleanup });

    expect(value).toBe("done");
    expect(onCleanup).toHaveBeenCalled();
  });

  it("should cleanup after runInRequestScopeAsync when ALS is unsupported", async () => {
    vi.spyOn(requestScopeStore, "isRequestScopeSupported").mockReturnValue(false);
    const onCleanup = vi.fn();

    await expect(runInRequestScopeAsync(async () => "done", { onCleanup })).resolves.toBe("done");
    expect(onCleanup).toHaveBeenCalled();
  });

  it("brushyRequestScope should clear request scope on close", () => {
    const container = new Container();
    const clearSpy = vi.spyOn(container, "clearRequestScope");

    const middleware = brushyRequestScope({ container });
    const closeHandlers: Array<() => void> = [];

    const res = {
      on: (event: string, fn: () => void) => {
        if (event === "close") closeHandlers.push(fn);
      },
    };

    middleware({}, res, () => undefined);
    closeHandlers.forEach((fn) => fn());

    expect(clearSpy).toHaveBeenCalled();
  });

  it("should honor skipRequestScopeCleanup and onEnter callbacks", () => {
    const container = new Container();
    const clearSpy = vi.spyOn(container, "clearRequestScope");
    const onEnter = vi.fn();

    runInRequestScope(() => undefined, {
      container,
      onEnter,
      skipRequestScopeCleanup: true,
    });

    expect(onEnter).toHaveBeenCalled();
    expect(clearSpy).not.toHaveBeenCalled();
  });

  it("should call onEnter inside async request scopes", async () => {
    const onEnter = vi.fn();

    await runInRequestScopeAsync(async () => "ok", {
      scope: { brushyRequestId: "custom" },
      onEnter,
    });

    expect(onEnter).toHaveBeenCalledWith({ brushyRequestId: "custom" });
  });

  it("brushyRequestScope should use a custom container cleanup callback", () => {
    const container = new Container();
    const onCleanup = vi.fn();
    const finishHandlers: Array<() => void> = [];

    const middleware = brushyRequestScope({ container, onCleanup });
    const res = {
      on: (event: string, fn: () => void) => {
        if (event === "finish") finishHandlers.push(fn);
      },
    };

    middleware({}, res, () => undefined);
    finishHandlers.forEach((fn) => fn());

    expect(onCleanup).toHaveBeenCalledWith(container);
  });

  it("brushyRequestScope should ignore cleanup when no container is provided", () => {
    const finishHandlers: Array<() => void> = [];
    const middleware = brushyRequestScope();
    const res = {
      on: (event: string, fn: () => void) => {
        if (event === "finish") finishHandlers.push(fn);
      },
    };

    expect(() => {
      middleware({}, res, () => undefined);
      finishHandlers.forEach((fn) => fn());
    }).not.toThrow();
  });
});
