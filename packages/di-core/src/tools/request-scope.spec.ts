import { describe, it, expect, vi } from "vitest";
import { Container } from "../core/container";
import { containerRegistry } from "../registry";
import { resolve } from "./resolve";
import {
  getActiveScope,
  runInRequestScope,
  runInRequestScopeAsync,
  brushyRequestScope,
  isRequestScopeSupported,
} from "./request-scope";
import { createToken } from "../types/tokens";

describe("request-scope", () => {
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

    runInRequestScope(() => {
      a = resolve(COUNTER).value;
      resolve(COUNTER).value = 1;
    }, { container });

    runInRequestScope(() => {
      b = resolve(COUNTER).value;
    }, { container });

    expect(a).toBe(0);
    expect(b).toBe(0);
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
});
