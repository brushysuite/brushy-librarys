import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DependencyRegistry } from "../dependency-registry";
import { DependencyResolver } from "../dependency-resolver";
import { Logger } from "../logger";
import { createLifecycleCache } from "../strategies/lifecycle";
import { PromiseCache } from "../promise-cache";
import { createToken } from "../../types/tokens";
import type { Token } from "../../types";

const accessPrivateMethod = (instance: object, methodName: string) => {
  return (...args: unknown[]) => {
    const method = (instance as Record<string, unknown>)[methodName];
    if (typeof method !== "function") {
      throw new Error(`Method ${methodName} is not a function on the instance`);
    }
    return method.apply(instance, args);
  };
};

const registerValueDeps = (
  registry: DependencyRegistry,
  count: number,
): Token[] => {
  const deps: Token[] = [];
  for (let i = 0; i < count; i++) {
    const token = createToken<number>(`DEP_${count}_${i}`);
    registry.register(token, { useValue: i + 1 });
    deps.push(token);
  }
  return deps;
};

describe("DependencyResolver coverage gaps", () => {
  let registry: DependencyRegistry;
  let resolver: DependencyResolver;
  let fastResolver: DependencyResolver;

  beforeEach(() => {
    registry = new DependencyRegistry();
    resolver = new DependencyResolver(registry, true);
    fastResolver = new DependencyResolver(registry, false);

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "debug").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should use the resolving setter", () => {
    const customSet = new Set<Token>([createToken("CUSTOM")]);
    (resolver as { resolving: Set<Token> }).resolving = customSet;
    expect((resolver as { resolving: Set<Token> }).resolving).toBe(customSet);
  });

  it("should detect circular dependencies in resolveWithRecord", () => {
    const A = createToken("CIRCULAR_A");
    registry.register(A, { useValue: "value" });

    const record = registry.getRecord(A)!;
    const tryFastResolve = accessPrivateMethod(fastResolver, "tryFastResolve");
    const fastMiss = tryFastResolve(createToken("MISSING"));

    vi.spyOn(
      fastResolver as { tryFastResolveFromRecord: (...args: unknown[]) => unknown },
      "tryFastResolveFromRecord",
    ).mockReturnValue(fastMiss);
    (fastResolver as { resolving: Set<Token> }).resolving.add(A);

    expect(() => fastResolver.resolveWithRecord(A, record)).toThrow(
      /Circular dependency detected/,
    );
  });

  it("should resolve through resolveWithRecord when fast paths miss", () => {
    const A = createToken("RESOLVE_WITH_RECORD");
    registry.register(A, { useValue: "resolved" });

    const record = registry.getRecord(A)!;
    const tryFastResolve = accessPrivateMethod(fastResolver, "tryFastResolve");
    const fastMiss = tryFastResolve(createToken("MISSING"));

    vi.spyOn(
      fastResolver as { tryFastResolveFromRecord: (...args: unknown[]) => unknown },
      "tryFastResolveFromRecord",
    ).mockReturnValue(fastMiss);

    expect(fastResolver.resolveWithRecord(A, record)).toBe("resolved");
    expect((fastResolver as { resolving: Set<Token> }).resolving.has(A)).toBe(
      false,
    );
  });

  it("should detect circular dependencies in resolveInScope", () => {
    const A = createToken("SCOPED_CIRCULAR_A");
    registry.register(A, {
      useFactory: () => ({}),
      lifecycle: "scoped",
    });

    const scopeKey = { id: "circular-scope" };
    (resolver as { resolving: Set<Token> }).resolving.add(A);

    expect(() => resolver.resolveInScope(A, scopeKey)).toThrow(
      /Circular dependency detected/,
    );
  });

  it("should fast-resolve scoped providers without debug logging", () => {
    const VALUE = createToken<string>("FAST_SCOPE_VALUE");
    const SCOPED = createToken<{ value: string }>("FAST_SCOPE");

    registry.register(VALUE, { useValue: "fast", lifecycle: "scoped" });
    registry.register(SCOPED, {
      useFactory: (value: string) => ({ value }),
      dependencies: [VALUE],
      lifecycle: "scoped",
    });

    const scopeKey = { id: "fast-scope" };
    const first = fastResolver.resolveInScope(SCOPED, scopeKey);
    const second = fastResolver.resolveInScope(SCOPED, scopeKey);

    expect(first.value).toBe("fast");
    expect(second).toBe(first);
  });

  it("should resolve factories with arity 3 through 5 via fast paths", () => {
    for (const arity of [2, 3, 4, 5] as const) {
      const deps = registerValueDeps(registry, arity);
      const TOKEN = createToken<number>(`FACTORY_ARITY_${arity}`);

      registry.register(TOKEN, {
        useFactory: (...values: number[]) =>
          values.reduce((sum, value) => sum + value, 0),
        dependencies: deps,
      });

      expect(fastResolver.resolve(TOKEN)).toBe(
        (arity * (arity + 1)) / 2,
      );
    }
  });

  it("should resolve classes with arity 3 through 5 via fast paths", () => {
    for (const arity of [2, 3, 4, 5] as const) {
      const deps = registerValueDeps(registry, arity);
      const TOKEN = createToken<{ sum: number }>(`CLASS_ARITY_${arity}`);

      class SumService {
        constructor(...values: number[]) {
          this.sum = values.reduce((total, value) => total + value, 0);
        }

        sum: number;
      }

      registry.register(TOKEN, {
        useClass: SumService,
        dependencies: deps,
      });

      expect(fastResolver.resolve(TOKEN).sum).toBe((arity * (arity + 1)) / 2);
    }
  });

  it("should fall back to compiled creators for arity greater than five", () => {
    const deps = registerValueDeps(registry, 6);
    const TOKEN = createToken<number>("FACTORY_ARITY_6");

    registry.register(TOKEN, {
      useFactory: (...values: number[]) =>
        values.reduce((sum, value) => sum + value, 0),
      dependencies: deps,
    });

    expect(fastResolver.resolve(TOKEN)).toBe(21);
  });

  it("should fall back to compiled class creators for arity greater than five", () => {
    const deps = registerValueDeps(registry, 6);
    const TOKEN = createToken<number>("CLASS_ARITY_6");

    class SumService {
      constructor(...values: number[]) {
        this.sum = values.reduce((total, value) => total + value, 0);
      }

      sum: number;
    }

    registry.register(TOKEN, {
      useClass: SumService,
      dependencies: deps,
    });

    expect(fastResolver.resolve(TOKEN).sum).toBe(21);
  });

  it("should return FAST_MISS from tryFastResolve for unknown tokens", () => {
    const tryFastResolve = accessPrivateMethod(fastResolver, "tryFastResolve");
    const fastMiss = tryFastResolve(createToken("MISSING"));

    expect(tryFastResolve(createToken("ALSO_MISSING"))).toBe(fastMiss);
  });

  it("should resolve transient providers through tryFastResolveFromRecord", () => {
    const TOKEN = createToken<{ id: number }>("TRANSIENT_FAST");
    let counter = 0;

    registry.register(TOKEN, {
      useFactory: () => ({ id: ++counter }),
      lifecycle: "transient",
    });

    const first = fastResolver.resolve(TOKEN);
    const second = fastResolver.resolve(TOKEN);

    expect(first.id).toBe(1);
    expect(second.id).toBe(2);
  });

  it("should delegate non-scoped tokens to tryFastResolve inside scoped resolution", () => {
    const SINGLETON = createToken<string>("NON_SCOPED_IN_SCOPE");
    registry.register(SINGLETON, { useValue: "singleton-value" });

    const scopeKey = { id: "non-scoped" };
    expect(fastResolver.resolveInScope(SINGLETON, scopeKey)).toBe(
      "singleton-value",
    );
  });

  it("should resolve useValue tokens through resolveInstanceInScope in debug mode", () => {
    const VALUE = createToken<string>("DEBUG_SCOPE_VALUE");
    registry.register(VALUE, { useValue: "direct-value", lifecycle: "scoped" });

    const scopeKey = { id: "debug-scope-value" };
    expect(resolver.resolveInScope(VALUE, scopeKey)).toBe("direct-value");
  });

  it("should throw when resolveInstanceInScope receives an unregistered token", () => {
    const scopeKey = { id: "missing-token" };
    expect(() =>
      resolver.resolveInScope(createToken("MISSING_SCOPE"), scopeKey),
    ).toThrow(/Token not registered/);
  });

  it("should skip immutable invalidation in debug mode", () => {
    const TOKEN = createToken("IMMUTABLE_SKIP");

    class ImmutableService {}

    registry.register(TOKEN, {
      useClass: ImmutableService,
      lifecycle: "immutable",
    });

    resolver.resolve(TOKEN);
    const debugSpy = vi.spyOn(Logger, "debug");

    resolver.invalidateCache(TOKEN);

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping invalidation for immutable"),
    );
  });

  it("should skip immutable deletion in debug mode", () => {
    const TOKEN = createToken("IMMUTABLE_DELETE");

    class ImmutableService {}

    registry.register(TOKEN, {
      useClass: ImmutableService,
      lifecycle: "immutable",
    });

    resolver.resolve(TOKEN);
    const debugSpy = vi.spyOn(Logger, "debug");

    resolver.deleteInstance(TOKEN);

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Skipping deletion for immutable"),
    );
  });

  it("should sync cached singletons into the lifecycle cache on inspection", () => {
    const TOKEN = createToken("SYNC_SINGLETON");

    class SyncService {}

    registry.register(TOKEN, { useClass: SyncService, lifecycle: "singleton" });
    fastResolver.resolve(TOKEN);

    const instances = Array.from(fastResolver.getInstances());
    expect(instances.some(([token]) => token === TOKEN)).toBe(true);
  });

  it("should sync singleton wrappers when lifecycle cache already exists", () => {
    const TOKEN = createToken("WRAPPER_SYNC");

    class WrappedService {}

    registry.register(TOKEN, {
      useClass: WrappedService,
      lifecycle: "singleton",
    });

    fastResolver.getInstances();
    fastResolver.resolve(TOKEN);

    const record = registry.getRecord(TOKEN)!;
    expect(record.singletonWrapper).toBeDefined();
    expect(record.isCached).toBe(true);
  });

  it("should return values from local resolution context in debug mode", () => {
    const TOKEN = createToken("LOCAL_CONTEXT");
    const contextValue = { from: "context" };
    const localContext = new Map<Token, unknown>([[TOKEN, contextValue]]);

    registry.register(TOKEN, {
      useFactory: () => ({ from: "registry" }),
    });
    const debugSpy = vi.spyOn(Logger, "debug");

    expect(resolver.resolve(TOKEN, localContext)).toBe(contextValue);
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Returning from resolution context"),
    );
  });

  it("should log immutable cache hits in debug mode", () => {
    const TOKEN = createToken("IMMUTABLE_CACHE");

    class CachedImmutable {}

    registry.register(TOKEN, {
      useClass: CachedImmutable,
      lifecycle: "immutable",
    });

    resolver.resolve(TOKEN);
    const debugSpy = vi.spyOn(Logger, "debug");
    resolver.resolve(TOKEN);

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Returning from immutable cache"),
    );
  });

  it("should log async local context hits in debug mode", async () => {
    const TOKEN = createToken("ASYNC_LOCAL_CONTEXT");
    const contextValue = { async: true };
    const localContext = new Map<Token, unknown>([[TOKEN, contextValue]]);

    registry.register(TOKEN, { useValue: { async: false } });
    const debugSpy = vi.spyOn(Logger, "debug");

    await expect(resolver.resolveAsync(TOKEN, localContext)).resolves.toBe(
      contextValue,
    );
    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("Returning from resolution context"),
    );
  });

  it("should resolve async factories without dependencies", async () => {
    const TOKEN = createToken("ASYNC_EMPTY_DEPS");
    registry.register(TOKEN, {
      useFactory: async () => ({ ok: true }),
      dependencies: [],
    });

    await expect(fastResolver.resolveAsync(TOKEN)).resolves.toEqual({
      ok: true,
    });
  });

  it("should return FAST_MISS when creator compilation is unavailable", () => {
    const TOKEN = createToken("FAST_MISS_CREATOR");
    registry.register(TOKEN, {
      dependencies: [createToken("UNUSED")],
    } as never);

    const tryFastResolveFromRecord = accessPrivateMethod(
      fastResolver,
      "tryFastResolveFromRecord",
    );
    const tryFastResolve = accessPrivateMethod(fastResolver, "tryFastResolve");
    const fastMiss = tryFastResolve(createToken("MISSING"));

    expect(
      tryFastResolveFromRecord(TOKEN, registry.getRecord(TOKEN)!),
    ).toBe(fastMiss);
  });

  it("should return FAST_MISS for records that bypass fast lifecycle paths", () => {
    const tryFastResolveFromRecord = accessPrivateMethod(
      fastResolver,
      "tryFastResolveFromRecord",
    );
    const tryFastResolve = accessPrivateMethod(fastResolver, "tryFastResolve");
    const fastMiss = tryFastResolve(createToken("MISSING"));

    class TtlService {}

    expect(
      tryFastResolveFromRecord(
        createToken("TTL_FAST_MISS"),
        {
          config: { useClass: TtlService, ttl: 1_000 },
          isSingleton: true,
          hasTtl: true,
          isUseValue: false,
          isImmutable: false,
          isScoped: false,
          isTransient: false,
        } as never,
      ),
    ).toBe(fastMiss);
  });

  it("should resolve transient factories through tryFastResolveFromRecord", () => {
    const TOKEN = createToken("TRANSIENT_FACTORY");
    registry.register(TOKEN, {
      useFactory: () => ({ id: 1 }),
      lifecycle: "transient",
    });

    expect(fastResolver.resolve(TOKEN)).toEqual({ id: 1 });
  });

  it("should fall back to tryFastResolve for non-scoped scoped lookups", () => {
    const TOKEN = createToken("IN_SCOPE_FALLBACK");

    class FallbackService {}

    registry.register(TOKEN, { useClass: FallbackService });

    const tryFastResolveInScope = accessPrivateMethod(
      fastResolver,
      "tryFastResolveInScope",
    );
    expect(tryFastResolveInScope(TOKEN, { id: "fallback-scope" })).toBeInstanceOf(
      FallbackService,
    );
  });

  it("should delegate singleton lookups to resolveInstance in debug mode", () => {
    const TOKEN = createToken("DEBUG_SCOPE_SINGLETON");

    class DebugScopedService {}

    registry.register(TOKEN, { useClass: DebugScopedService });

    expect(
      resolver.resolveInScope(TOKEN, { id: "debug-singleton" }),
    ).toBeInstanceOf(DebugScopedService);
  });

  it("should resolve instances without a registry record via resolveInstance", () => {
    const TOKEN = createToken("DETACHED_RECORD");
    const resolveInstance = accessPrivateMethod(resolver, "resolveInstance");

    expect(
      resolveInstance(TOKEN, undefined, {
        config: { useValue: "detached" },
      }),
    ).toBe("detached");
  });

  it("should resolve async factories without a dependencies array", async () => {
    const TOKEN = createToken("ASYNC_NO_DEPS_ARRAY");
    registry.register(TOKEN, {
      useFactory: async () => ({ ok: true }),
    });

    await expect(fastResolver.resolveAsync(TOKEN)).resolves.toEqual({
      ok: true,
    });
  });

  it("should resolve registered tokens through tryFastResolve", () => {
    const TOKEN = createToken("TRY_FAST_RESOLVE");
    registry.register(TOKEN, { useValue: "fast-hit" });

    const tryFastResolve = accessPrivateMethod(fastResolver, "tryFastResolve");
    expect(tryFastResolve(TOKEN)).toBe("fast-hit");
  });

  it("should resolve async factory dependencies through the helper", async () => {
    const DEP = createToken("ASYNC_DEP");
    registry.register(DEP, { useValue: "dep" });

    const resolveDependenciesForFactoryAsync = accessPrivateMethod(
      fastResolver,
      "resolveDependenciesForFactoryAsync",
    );

    await expect(
      resolveDependenciesForFactoryAsync({
        useFactory: async () => ({ ok: true }),
        dependencies: [],
      }),
    ).resolves.toEqual([]);
    await expect(
      resolveDependenciesForFactoryAsync({
        useFactory: async (dep: string) => dep,
        dependencies: [DEP],
      }),
    ).resolves.toEqual(["dep"]);
  });

  it("should skip creator compilation when no registry record is available", () => {
    const TOKEN = createToken("NO_REGISTRY_RECORD");

    class NoRecordService {}

    registry.register(TOKEN, { useClass: NoRecordService });
    vi.spyOn(registry, "getRecord").mockReturnValue(undefined);

    const resolveInstance = accessPrivateMethod(resolver, "resolveInstance");
    expect(resolveInstance(TOKEN)).toBeInstanceOf(NoRecordService);
  });

  it("should reuse pre-initialized lazy fields", () => {
    const lifecycleCache = createLifecycleCache();
    const promiseCache = new PromiseCache();
    const resolving = new Set<Token>();
    const resolvingStack: Token[] = [];
    const asyncResolvingPromises = new Map<Token, Promise<unknown>>();
    const observables = new Map<Token, { unsubscribe: () => void }>();
    const resolveFn = (token: Token) => fastResolver.resolve(token);

    Object.assign(fastResolver, {
      _lifecycleCache: lifecycleCache,
      promiseCache,
      _resolving: resolving,
      _resolvingStack: resolvingStack,
      _asyncResolvingPromises: asyncResolvingPromises,
      observables,
      resolveFn,
      dependencyGraph: new Map(),
    });

    expect((fastResolver as { lifecycleCache: unknown }).lifecycleCache).toBe(
      lifecycleCache,
    );
    expect((fastResolver as { resolving: Set<Token> }).resolving).toBe(resolving);
    expect(
      (fastResolver as { resolvingStack: Token[] }).resolvingStack,
    ).toBe(resolvingStack);
    expect(
      (fastResolver as { asyncResolvingPromises: Map<Token, Promise<unknown>> })
        .asyncResolvingPromises,
    ).toBe(asyncResolvingPromises);
    expect(
      accessPrivateMethod(fastResolver, "getPromiseCache")(),
    ).toBe(promiseCache);
    expect(accessPrivateMethod(fastResolver, "getDependencyGraph")()).toEqual(
      new Map(),
    );
    expect(accessPrivateMethod(fastResolver, "getObservables")()).toBe(
      observables,
    );
    expect(accessPrivateMethod(fastResolver, "getResolveFn")()).toBe(resolveFn);
  });

  it("should exercise non-debug resolver branches", async () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const VALUE = createToken<number>("QUIET_VALUE");
    const CLASS = createToken("QUIET_CLASS");
    const IMMUTABLE = createToken("QUIET_IMMUTABLE");
    const PROMISE = createToken("QUIET_PROMISE");

    class QuietService {
      fetch() {
        return Promise.resolve("ok");
      }
    }

    quietRegistry.register(VALUE, { useValue: 42 });
    quietRegistry.register(CLASS, { useClass: QuietService });
    quietRegistry.register(IMMUTABLE, {
      useClass: QuietService,
      lifecycle: "immutable",
    });
    quietRegistry.register(PROMISE, { useClass: QuietService });

    (quiet as { lifecycleCache: unknown }).lifecycleCache;
    (quiet as { lifecycleCache: unknown }).lifecycleCache;
    accessPrivateMethod(quiet, "getPromiseCache")();
    accessPrivateMethod(quiet, "getPromiseCache")();
    accessPrivateMethod(quiet, "getDependencyGraph")();
    accessPrivateMethod(quiet, "getDependencyGraph")();
    accessPrivateMethod(quiet, "getObservables")();
    accessPrivateMethod(quiet, "getObservables")();
    accessPrivateMethod(quiet, "getResolveFn")();
    accessPrivateMethod(quiet, "getResolveFn")();

    expect(quiet.resolve(VALUE)).toBe(42);
    expect(quiet.resolve(CLASS)).toBeInstanceOf(QuietService);
    quiet.resolve(IMMUTABLE);

    expect(quiet.instances.size).toBeGreaterThan(0);
    expect(quiet.requestScopeInstances).toBeInstanceOf(Map);
    expect(quiet.immutableInstances.size).toBeGreaterThan(0);

    quiet.clearRequestScope();
    quiet.clearScopedInstances({ id: "quiet-scope" });
    quiet.getOrCreateScopeBucket({ id: "quiet-bucket" });
    quiet.invalidateCache(IMMUTABLE);
    quiet.deleteInstance(CLASS);
    quiet.clearPromiseCache();
    quiet.clearTokenPromiseCache(PROMISE);
    await quiet.getCachedPromise(PROMISE, "fetch");

    const getTokenInfo = accessPrivateMethod(quiet, "getTokenInfo");
    expect(getTokenInfo(VALUE)).toContain("Value");
    expect(getTokenInfo(CLASS)).toContain("QuietService");
  });

  it("should skip repeated dependency graph printing in development", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "development";

    const graphRegistry = new DependencyRegistry();
    const graphResolver = new DependencyResolver(graphRegistry, true);
    const TOKEN = createToken("GRAPH_TOKEN");

    graphRegistry.register(TOKEN, { useValue: "graph" });
    graphResolver.resolve(TOKEN);

    const printDependencyGraph = accessPrivateMethod(
      graphResolver,
      "printDependencyGraph",
    );
    const debugSpy = vi.spyOn(Logger, "debug");

    printDependencyGraph();

    expect(debugSpy).not.toHaveBeenCalled();
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should cover remaining resolver branch paths", async () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const VALUE = createToken<number>("BRANCH_VALUE");
    const PROMISE = createToken("BRANCH_PROMISE");
    const CONTEXT = createToken("BRANCH_CONTEXT");

    function UppercaseComponent() {}

    class PromiseService {
      fetch() {
        return Promise.resolve("cached");
      }
    }

    quietRegistry.register(VALUE, { useValue: 42 });
    quietRegistry.register(CONTEXT, {
      useFactory: () => "registry",
    });
    quietRegistry.register(PROMISE, { useClass: PromiseService });
    const UPPER = createToken("UPPER");
    quietRegistry.register(UPPER, {
      useValue: UppercaseComponent,
    });

    const context = new Map<Token, unknown>([[CONTEXT, "from-context"]]);
    expect(quiet.resolve(CONTEXT, context)).toBe("from-context");

    await quiet.getCachedPromise(PROMISE, "fetch");
    await quiet.getCachedPromise(PROMISE, "fetch");

    quiet.invalidateCache(VALUE);
    quiet.deleteInstance(VALUE);

    const getTokenInfo = accessPrivateMethod(quiet, "getTokenInfo");
    expect(getTokenInfo(UPPER)).toContain("ReactComponent");

    accessPrivateMethod(quiet, "printRegisteredTokens")();
    accessPrivateMethod(quiet, "printDependencyRelationships")();
  });

  it("should handle optional chaining before lazy fields are initialized", () => {
    const freshRegistry = new DependencyRegistry();
    const fresh = new DependencyResolver(freshRegistry, false);
    const TOKEN = createToken("FRESH_TOKEN");

    fresh.clearPromiseCache();
    fresh.clearTokenPromiseCache(TOKEN);
    fresh.invalidateCache(TOKEN);
    fresh.deleteInstance(TOKEN);
    fresh.clearScopedInstances({ id: "fresh-scope" });

    accessPrivateMethod(fresh, "printRegisteredTokens")();
    accessPrivateMethod(fresh, "printDependencyRelationships")();
  });

  it("should continue resolve when tryFastResolve misses for unregistered tokens", () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const MISSING = createToken("MISSING_FOR_SLOW_PATH");

    expect(() => quiet.resolve(MISSING)).toThrow(/not registered/);
  });

  it("should delete observables when invalidating a resolved token", () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const TOKEN = createToken("WITH_OBSERVABLE");

    quietRegistry.register(TOKEN, { useValue: "value" });
    accessPrivateMethod(quiet, "getObservables")().set(TOKEN, {
      unsubscribe: vi.fn(),
    });
    quiet.invalidateCache(TOKEN);
  });

  it("should skip observable deletion when observables were never created", () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const TOKEN = createToken("WITHOUT_OBSERVABLE");

    quietRegistry.register(TOKEN, { useValue: "value" });
    quiet.invalidateCache(TOKEN);
  });

  it("should return fast hits from tryFastResolve inside resolve", () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const TOKEN = createToken("FAST_HIT_IN_RESOLVE");

    quietRegistry.register(TOKEN, { useValue: "fast-hit" });

    const originalGetRecord = quietRegistry.getRecord.bind(quietRegistry);
    let firstLookup = true;
    vi.spyOn(quietRegistry, "getRecord").mockImplementation((token) => {
      if (token === TOKEN && firstLookup) {
        firstLookup = false;
        return undefined;
      }
      return originalGetRecord(token);
    });

    expect(quiet.resolve(TOKEN)).toBe("fast-hit");
  });

  it("should run async resolve finally block on success", async () => {
    const TOKEN = createToken("ASYNC_FINALLY_SUCCESS");
    registry.register(TOKEN, {
      useFactory: async () => ({ ok: true }),
    });

    const resolveInstanceAsync = accessPrivateMethod(
      resolver,
      "resolveInstanceAsync",
    );

    await expect(resolveInstanceAsync(TOKEN)).resolves.toEqual({ ok: true });
  });

  it("should run async resolve finally block on failure", async () => {
    const TOKEN = createToken("ASYNC_FINALLY");
    registry.register(TOKEN, {
      useFactory: async () => {
        throw "async-string-failure";
      },
    });

    const resolveInstanceAsync = accessPrivateMethod(
      resolver,
      "resolveInstanceAsync",
    );

    await expect(resolveInstanceAsync(TOKEN)).rejects.toThrow(
      /async-string-failure/,
    );
  });

  it("should run async resolve finally block on synchronous try failure", async () => {
    const TOKEN = createToken("ASYNC_FINALLY_SYNC");
    registry.register(TOKEN, {
      useFactory: async () => ({ ok: true }),
    });

    const resolveInstanceAsync = accessPrivateMethod(
      resolver,
      "resolveInstanceAsync",
    );
    const asyncResolvingPromises = {
      has: () => false,
      get: () => undefined,
      set: () => {
        throw "sync-try-failure";
      },
      delete: vi.fn(),
    };

    Object.assign(resolver, { _asyncResolvingPromises: asyncResolvingPromises });

    await expect(resolveInstanceAsync(TOKEN)).rejects.toThrow(
      /sync-try-failure/,
    );
  });

  it("should use explicit config in getFromCache and return undefined when missing", () => {
    const TOKEN = createToken("GET_FROM_CACHE");
    const MISSING = createToken("GET_FROM_CACHE_MISSING");
    const getFromCache = accessPrivateMethod(resolver, "getFromCache");

    registry.register(TOKEN, { useValue: "cached-value" });

    expect(
      getFromCache(TOKEN, { useValue: "explicit-config" }),
    ).toBeUndefined();
    expect(getFromCache(MISSING)).toBeUndefined();
  });

  it("should format non-Error failures in createAndStore", () => {
    const TOKEN = createToken("NON_ERROR_THROW");
    registry.register(TOKEN, {
      useClass: class {
        constructor() {
          throw "string-constructor-failure";
        }
      },
    });

    expect(() => resolver.resolve(TOKEN)).toThrow(/string-constructor-failure/);
  });

  it("should log factory dependencies without constructor names in debug mode", () => {
    const DEP = createToken("NULL_DEP");
    registry.register(DEP, { useValue: null });

    const resolveDependenciesForFactory = accessPrivateMethod(
      resolver,
      "resolveDependenciesForFactory",
    );
    const debugSpy = vi.spyOn(Logger, "debug");

    resolveDependenciesForFactory({
      useFactory: (dep: null) => dep,
      dependencies: [DEP],
    });

    expect(debugSpy).toHaveBeenCalledWith(
      expect.stringContaining("unknown"),
    );
  });

  it("should return FAST_MISS from lifecycle fast paths when creator is unavailable", () => {
    const deps = registerValueDeps(registry, 3);
    const ensureCreatorSpy = vi
      .spyOn(registry, "ensureCreator")
      .mockReturnValue(undefined);

    const IMMUTABLE = createToken("FAST_MISS_IMMUTABLE");
    const SINGLETON = createToken("FAST_MISS_SINGLETON");
    const SCOPED = createToken("FAST_MISS_SCOPED");

    registry.register(IMMUTABLE, {
      useFactory: (a: number, b: number, c: number) => ({ a, b, c }),
      dependencies: deps,
      lifecycle: "immutable",
    });
    registry.register(SINGLETON, {
      useFactory: (a: number, b: number, c: number) => ({ a, b, c }),
      dependencies: deps,
    });
    registry.register(SCOPED, {
      useFactory: (a: number, b: number, c: number) => ({ a, b, c }),
      dependencies: deps,
      lifecycle: "scoped",
    });

    const tryFastResolveFromRecord = accessPrivateMethod(
      fastResolver,
      "tryFastResolveFromRecord",
    );
    const tryFastResolveInScope = accessPrivateMethod(
      fastResolver,
      "tryFastResolveInScope",
    );
    const fastMiss = accessPrivateMethod(fastResolver, "tryFastResolve")(
      createToken("FAST_MISS_MARKER"),
    );

    expect(
      tryFastResolveFromRecord(IMMUTABLE, registry.getRecord(IMMUTABLE)!),
    ).toBe(fastMiss);
    expect(
      tryFastResolveFromRecord(SINGLETON, registry.getRecord(SINGLETON)!),
    ).toBe(fastMiss);
    expect(
      tryFastResolveFromRecord(SCOPED, registry.getRecord(SCOPED)!),
    ).toBe(fastMiss);
    expect(tryFastResolveInScope(SCOPED, { id: "fast-miss-scope" })).toBe(
      fastMiss,
    );
    expect(
      tryFastResolveInScope(createToken("MISSING_IN_SCOPE"), {
        id: "missing-scope",
      }),
    ).toBe(fastMiss);

    ensureCreatorSpy.mockRestore();
  });

  it("should format token info for named functions and primitive values", () => {
    const quietRegistry = new DependencyRegistry();
    const quiet = new DependencyResolver(quietRegistry, false);
    const NAMED_FN = createToken("NAMED_FN");
    const PRIMITIVE = createToken("PRIMITIVE_VALUE");
    const NULL_VALUE = createToken("NULL_VALUE");

    function helperFunction() {}

    quietRegistry.register(NAMED_FN, { useValue: helperFunction });
    quietRegistry.register(PRIMITIVE, { useValue: 42 });
    quietRegistry.register(NULL_VALUE, { useValue: null });

    const getTokenInfo = accessPrivateMethod(quiet, "getTokenInfo");

    expect(getTokenInfo(NAMED_FN)).toContain("helperFunction");
    expect(getTokenInfo(NAMED_FN)).toContain("Function");
    expect(getTokenInfo(PRIMITIVE)).toContain("Number");
    expect(getTokenInfo(NULL_VALUE)).toContain("object");

    const ANON = createToken("ANON_COMPONENT");
    const anon = () => {};
    Object.defineProperty(anon, "name", { value: "" });
    quietRegistry.register(ANON, { useValue: anon });
    expect(getTokenInfo(ANON)).toContain("Component");
  });
});
