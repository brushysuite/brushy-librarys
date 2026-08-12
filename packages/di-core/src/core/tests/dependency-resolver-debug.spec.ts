import { describe, expect, it, vi, beforeEach } from "vitest";
import { DependencyRegistry } from "../dependency-registry";
import { DependencyResolver } from "../dependency-resolver";
import { Logger } from "../logger";
import { createToken } from "../../types/tokens";

const accessPrivateMethod = <T extends object, K extends keyof T>(
  target: T,
  method: K,
): T[K] => {
  return target[method];
};

describe("DependencyResolver debug coverage", () => {
  beforeEach(() => {
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
  });

  it("should print cached immutable and singleton instances", () => {
    const registry = new DependencyRegistry();
    class ImmutableService {}
    class SingletonService {}

    const IMMUTABLE = createToken("IMMUTABLE");
    const SINGLETON = createToken("SINGLETON");

    registry.register(IMMUTABLE, { useClass: ImmutableService, lifecycle: "immutable" });
    registry.register(SINGLETON, { useClass: SingletonService, lifecycle: "singleton" });

    const resolver = new DependencyResolver(registry, true);
    resolver.resolve(IMMUTABLE);
    resolver.resolve(SINGLETON);

    const debugSpy = vi.spyOn(Logger, "debug");
    accessPrivateMethod(resolver, "printCachedInstances").call(resolver);

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Immutable"),
    );
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Last used"),
    );
  });

  it("should resolve scoped class instances in an explicit scope bucket", () => {
    const registry = new DependencyRegistry();
    class ScopedService {
      constructor(public value: string) {}
    }

    const VALUE = createToken<string>("VALUE");
    const SCOPED = createToken<ScopedService>("SCOPED");

    registry.register(VALUE, { useValue: "scoped-dep" });
    registry.register(SCOPED, {
      useClass: ScopedService,
      dependencies: [VALUE],
      lifecycle: "scoped",
    });

    const resolver = new DependencyResolver(registry, true);
    const scopeKey = { id: "resolver-scope" };

    const first = resolver.resolveInScope(SCOPED, scopeKey);
    const second = resolver.resolveInScope(SCOPED, scopeKey);

    expect(first.value).toBe("scoped-dep");
    expect(second).toBe(first);
  });
});
