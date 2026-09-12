import { describe, expect, it, vi } from "vitest";
import { createToken } from "../../types/tokens";
import { Container, ScopedContainer } from "../container";

describe("scoped container API", () => {
  it("should resolve scoped providers through ScopedContainer", () => {
    const container = new Container();
    const SCOPED = container.register(createToken("SCOPED"), {
      useValue: "scoped-value",
      lifecycle: "scoped",
    });
    const scope = container.createScope();

    expect(scope).toBeInstanceOf(ScopedContainer);
    expect(scope.resolve(SCOPED)).toBe("scoped-value");
    expect(scope.resolve(SCOPED)).toBe("scoped-value");
  });

  it("should clear scoped instances for a scope key", () => {
    const container = new Container();
    let counter = 0;
    const SCOPED = container.register(createToken("SCOPED"), {
      useFactory: () => ({ id: ++counter }),
      lifecycle: "scoped",
    });
    const scopeKey = { id: "dispose" };
    const scope = container.createScope(scopeKey);
    const first = scope.resolve(SCOPED);

    container.clearScopedInstances(scopeKey);
    const second = container.resolveInScope(SCOPED, scopeKey);

    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
    expect(() => scope.dispose()).not.toThrow();
  });

  it("should resolve scoped tokens from parent containers", () => {
    const parent = new Container();
    const SCOPED = parent.register(createToken("SCOPED"), {
      useValue: "parent-scoped",
      lifecycle: "scoped",
    });
    const child = new Container({ parent });
    const scopeKey = { id: "shared" };

    expect(child.resolveInScope(SCOPED, scopeKey)).toBe("parent-scoped");
  });

  it("should resolve scoped tokens from parent containers when observed", () => {
    const parent = new Container({ name: "parent" });
    const SCOPED = parent.register(createToken("SCOPED_OBSERVED"), {
      useValue: "parent-scoped-observed",
      lifecycle: "scoped",
    });
    const child = new Container({ parent });
    const observer = vi.fn();
    const scopeKey = { id: "observed-parent-scope" };

    child.observe(observer);
    expect(child.resolveInScope(SCOPED, scopeKey)).toBe("parent-scoped-observed");
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "resolve",
        token: SCOPED,
        details: expect.objectContaining({
          success: true,
          scoped: true,
          source: "parent",
        }),
      }),
    );
  });

  it("should throw when resolving an unregistered scoped token without listeners", () => {
    const child = new Container();
    const MISSING = createToken("MISSING_UNOBSERVED");

    expect(() => child.resolveInScope(MISSING, { id: "missing" })).toThrow(/Token not registered/);
  });

  it("should emit scoped resolve and clear events when observed", () => {
    const container = new Container();
    const SCOPED = container.register(createToken("SCOPED"), {
      useValue: "observed",
      lifecycle: "scoped",
    });
    const observer = vi.fn();
    container.observe(observer);
    const scopeKey = { id: "observed-scope" };

    container.resolveInScope(SCOPED, scopeKey);
    container.clearScopedInstances(scopeKey);
    container.clearRequestScope();

    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "resolve",
        token: SCOPED,
        details: expect.objectContaining({ success: true, scoped: true }),
      }),
    );
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({ type: "clear", details: { scope: scopeKey } }),
    );
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({ type: "clear", details: { scope: "request" } }),
    );
  });

  it("should invalidate monomorphic resolve cache for a token", () => {
    const container = new Container();
    const SINGLETON = container.register(createToken("SINGLETON"), {
      useValue: "cached",
    });

    expect(container.resolve(SINGLETON)).toBe("cached");
    container.invalidateCache(SINGLETON);
    expect(container.resolve(SINGLETON)).toBe("cached");
  });

  it("should emit scoped resolve errors when observed", () => {
    const container = new Container();
    const observer = vi.fn();
    container.observe(observer);
    const MISSING = createToken("MISSING");

    expect(() => container.resolveInScope(MISSING, { id: "missing" })).toThrow(
      /Token not registered/,
    );
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({ type: "error", token: MISSING }),
    );
  });

  it("should stringify scoped resolve failures for non-Error throws", () => {
    const container = new Container();
    const observer = vi.fn();
    const TOKEN = createToken("SCOPED_STRING_ERROR");

    container.register(TOKEN, {
      useFactory: () => {
        throw "scoped string failure";
      },
      lifecycle: "scoped",
    });
    container.observe(observer);

    expect(() => container.resolveInScope(TOKEN, { id: "scoped-error" })).toThrow();
    expect(observer).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "error",
        details: expect.objectContaining({ message: "scoped string failure" }),
      }),
    );
  });

  it("should expose scope buckets through the container", () => {
    const container = new Container();
    const scopeKey = { id: "bucket" };
    const bucket = container.getOrCreateScopeBucket(scopeKey);

    expect(bucket).toBeInstanceOf(Map);
    expect(container.getOrCreateScopeBucket(scopeKey)).toBe(bucket);
  });
});
