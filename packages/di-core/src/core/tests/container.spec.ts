import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "../container";
import { Logger } from "../logger";

describe("Container", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container({ name: "test-container" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Basic registration and resolution", () => {
    it("should register and resolve a value", () => {
      const token = "TEST_VALUE";
      const value = "test-value";

      container.register(token, { useValue: value });
      const resolved = container.resolve(token);

      expect(resolved).toBe(value);
    });

    it("should register and resolve a class", () => {
      class TestService {
        getValue() {
          return "test-value";
        }
      }
      const token = "TEST_SERVICE";

      container.register(token, { useClass: TestService });
      const resolved = container.resolve<TestService>(token);

      expect(resolved).toBeInstanceOf(TestService);
      expect(resolved.getValue()).toBe("test-value");
    });

    it("should register and resolve a factory", () => {
      const token = "TEST_FACTORY";
      const factory = () => ({ value: "factory-value" });

      container.register(token, { useFactory: factory });
      const resolved = container.resolve(token);

      expect(resolved).toEqual({ value: "factory-value" });
    });

    it("should throw an error when resolving an unregistered token", () => {
      const token = "UNREGISTERED_TOKEN";

      expect(() => container.resolve(token)).toThrow();
    });

    it("should register providers during construction", () => {
      const token = "CONSTRUCTOR_TOKEN";
      const value = "constructor-value";

      const newContainer = new Container({
        providers: [
          {
            provide: token,
            useValue: value,
          },
        ],
      });

      expect(newContainer.resolve(token)).toBe(value);
    });
  });

  describe("Lifecycle management", () => {
    it("should create a new instance for each resolution with transient lifecycle", () => {
      class TestService {
        public id = Math.random();
      }
      const token = "TRANSIENT_SERVICE";

      container.register(token, {
        useClass: TestService,
        lifecycle: "transient",
      });

      const instance1 = container.resolve<TestService>(token);
      const instance2 = container.resolve<TestService>(token);

      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it("should reuse the same instance for singleton lifecycle", () => {
      class TestService {
        public id = Math.random();
      }
      const token = "SINGLETON_SERVICE";

      container.register(token, {
        useClass: TestService,
        lifecycle: "singleton",
      });

      const instance1 = container.resolve<TestService>(token);
      const instance2 = container.resolve<TestService>(token);

      expect(instance1).toBe(instance2);
      expect(instance1.id).toBe(instance2.id);
    });

    it("should clear request scope instances", () => {
      class TestService {
        public id = Math.random();
      }
      const token = "SCOPED_SERVICE";

      container.register(token, {
        useClass: TestService,
        lifecycle: "scoped",
      });

      const instance1 = container.resolve<TestService>(token);
      container.clearRequestScope();
      const instance2 = container.resolve<TestService>(token);

      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it("should start and stop garbage collector", () => {
      const startSpy = vi.spyOn(
        container["lifecycleManager"],
        "startGarbageCollector",
      );
      const stopSpy = vi.spyOn(
        container["lifecycleManager"],
        "stopGarbageCollector",
      );

      container.startGarbageCollector(30000, 10000);
      container.stopGarbageCollector();

      expect(startSpy).toHaveBeenCalledWith(30000, 10000);
      expect(stopSpy).toHaveBeenCalled();
    });

    it("should invalidate cache for a token", () => {
      class TestService {
        public id = Math.random();
      }
      const token = "CACHE_SERVICE";

      container.register(token, { useClass: TestService });
      const instance1 = container.resolve<TestService>(token);

      container.invalidateCache(token);
      const instance2 = container.resolve<TestService>(token);

      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });
  });

  describe("Dependency injection", () => {
    it("should inject dependencies into a class", () => {
      const dependencyToken = "DEPENDENCY";
      const dependency = { value: "dependency-value" };

      class ServiceWithDependency {
        constructor(private dep: typeof dependency) {}

        getDependencyValue() {
          return this.dep.value;
        }
      }

      const serviceToken = "SERVICE_WITH_DEP";

      container.register(dependencyToken, { useValue: dependency });
      container.register(serviceToken, {
        useClass: ServiceWithDependency,
        dependencies: [dependencyToken],
      });

      const service = container.resolve<ServiceWithDependency>(serviceToken);

      expect(service).toBeInstanceOf(ServiceWithDependency);
      expect(service.getDependencyValue()).toBe("dependency-value");
    });

    it("should inject dependencies into a factory", () => {
      const dependencyToken = "FACTORY_DEPENDENCY";
      const dependency = { value: "factory-dependency-value" };

      const factoryToken = "FACTORY_WITH_DEP";
      const factory = (dep: typeof dependency) => ({
        getValue: () => dep.value,
      });

      container.register(dependencyToken, { useValue: dependency });
      container.register(factoryToken, {
        useFactory: factory,
        dependencies: [dependencyToken],
      });

      const service = container.resolve(factoryToken) as any;

      expect(service.getValue()).toBe("factory-dependency-value");
    });

    it("should throw an error when a dependency is not registered", () => {
      class ServiceWithDependency {
        constructor(private dep: any) {}
      }

      const serviceToken = "SERVICE_WITH_MISSING_DEP";
      const missingDepToken = "MISSING_DEPENDENCY";

      container.register(serviceToken, {
        useClass: ServiceWithDependency,
        dependencies: [missingDepToken],
      });

      expect(() => container.resolve(serviceToken)).toThrow();
    });

    it("should detect circular dependencies", () => {
      const tokenA = "SERVICE_A";
      const tokenB = "SERVICE_B";

      class ServiceA {
        constructor(private b: any) {}
      }

      class ServiceB {
        constructor(private a: any) {}
      }

      container.register(tokenA, {
        useClass: ServiceA,
        dependencies: [tokenB],
      });

      container.register(tokenB, {
        useClass: ServiceB,
        dependencies: [tokenA],
      });

      expect(() => container.resolve(tokenA)).toThrow();
    });
  });

  describe("Observability", () => {
    it("should notify observers about events", () => {
      const observer = vi.fn();
      const token = "OBSERVABLE_TEST";

      const unsubscribe = container.observe(observer);
      container.register(token, { useValue: "test" });
      container.resolve(token);

      expect(observer).toHaveBeenCalledTimes(2);

      const registerEvent = observer.mock.calls[0][0];
      expect(registerEvent.type).toBe("register");
      expect(registerEvent.token).toBe(token);

      const resolveEvent = observer.mock.calls[1][0];
      expect(resolveEvent.type).toBe("resolve");
      expect(resolveEvent.token).toBe(token);

      unsubscribe();
      container.resolve(token);
      expect(observer).toHaveBeenCalledTimes(2);
    });

    it("should handle observer errors gracefully", () => {
      const errorMessage = "Observer error";
      const observer = vi.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });
      const token = "ERROR_OBSERVER_TEST";

      container.observe(observer);

      expect(() => {
        container.register(token, { useValue: "test" });
      }).not.toThrow();

      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should handle non-Error objects in observer errors", () => {
      const observer = vi.fn().mockImplementation(() => {
        throw "String error";
      });
      const token = "NON_ERROR_OBSERVER_TEST";

      container.observe(observer);

      expect(() => {
        container.register(token, { useValue: "test" });
      }).not.toThrow();

      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should notify observers about registration events", () => {
      const observer = vi.fn();
      const token = "OBSERVABLE_TEST";

      const unsubscribe = container.observe(observer);
      container.register(token, { useValue: "test" });

      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("register");
      expect(event.token).toBe(token);
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.details).toBeDefined();
    });

    it("should notify observers about resolution events", () => {
      const observer = vi.fn();
      const token = "OBSERVABLE_RESOLVE_TEST";

      container.register(token, { useValue: "test" });
      const unsubscribe = container.observe(observer);
      container.resolve(token);

      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("resolve");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();
    });

    it("should notify observers about error events", () => {
      const observer = vi.fn();
      const token = "OBSERVABLE_ERROR_TEST";

      const unsubscribe = container.observe(observer);

      try {
        container.resolve(token);
      } catch (error) {}

      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("error");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();
    });

    it("should unsubscribe observers correctly", () => {
      const observer = vi.fn();
      const token = "UNSUBSCRIBE_TEST";

      const unsubscribe = container.observe(observer);
      unsubscribe();
      container.register(token, { useValue: "test" });

      expect(observer).not.toHaveBeenCalled();
    });

    it("should emit error events with non-Error objects and convert them to strings", () => {
      const observer = vi.fn();
      const token = "NON_ERROR_TOKEN";
      const nonErrorValue = { custom: "error object" };

      container.observe(observer);

      const originalEmitEvent = container["emitEvent"];
      container["emitEvent"] = vi.fn().mockImplementation((event) => {
        if (event.type === "error") {
          event.details.error = nonErrorValue;
          event.details.message = String(nonErrorValue);
        }
        return originalEmitEvent.call(container, event);
      });

      try {
        container.resolve(token);
      } catch (error) {}

      container["emitEvent"] = originalEmitEvent;

      expect(observer).toHaveBeenCalledTimes(1);
      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("error");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();

      expect(event.details.message).toBeDefined();
    });
  });

  describe("Container import/export", () => {
    it("should import providers from another container", () => {
      const sourceContainer = new Container({ name: "source" });
      const token = "IMPORTED_VALUE";
      const value = "imported-value";

      sourceContainer.register(token, { useValue: value });
      container.import(sourceContainer);

      const resolved = container.resolve(token);

      expect(resolved).toBe(value);
    });

    it("should import with prefix", () => {
      const sourceContainer = new Container({ name: "source" });
      const token = "ORIGINAL_TOKEN";
      const value = "original-value";
      const prefix = "imported";

      sourceContainer.register(token, { useValue: value });
      container.import(sourceContainer, { prefix });

      const prefixedToken = `${prefix}.${token}`;
      const resolved = container.resolve(prefixedToken);

      expect(resolved).toBe(value);
    });

    it("should not override existing providers when importing unless specified", () => {
      const sourceContainer = new Container({ name: "source" });
      const token = "SHARED_TOKEN";
      const originalValue = "original-value";
      const importedValue = "imported-value";

      container.register(token, { useValue: originalValue });
      sourceContainer.register(token, { useValue: importedValue });

      container.import(sourceContainer);
      const resolved1 = container.resolve(token);

      container.import(sourceContainer, { overrideExisting: true });
      const resolved2 = container.resolve(token);

      expect(resolved1).toBe(originalValue);
      expect(resolved2).toBe(importedValue);
    });

    it("should export all providers", () => {
      const token1 = "TOKEN_1";
      const token2 = "TOKEN_2";

      container.register(token1, { useValue: "value1" });
      container.register(token2, { useValue: "value2" });

      const exported = container.exportProviders();

      expect(exported).toHaveLength(2);
      expect(exported.map((e) => e.token)).toContain(token1);
      expect(exported.map((e) => e.token)).toContain(token2);
    });

    it("should get container name", () => {
      const name = container.getName();

      expect(name).toBe("test-container");
    });
  });

  describe("Async resolution", () => {
    it("should resolve dependencies asynchronously", async () => {
      const token = "ASYNC_SERVICE";
      const asyncFactory = async () => {
        return { value: "async-value" };
      };

      container.register(token, { useFactory: asyncFactory });
      const result = await container.resolveAsync(token);

      expect(result).toEqual({ value: "async-value" });
    });

    it("should handle async resolution errors", async () => {
      const token = "ASYNC_ERROR_SERVICE";
      const asyncFactory = async () => {
        throw new Error("Async factory error");
      };

      container.register(token, { useFactory: asyncFactory });

      await expect(container.resolveAsync(token)).rejects.toThrow();
    });

    it("should handle non-Error objects in async resolution errors", async () => {
      const token = "ASYNC_NON_ERROR_SERVICE";
      const asyncFactory = async () => {
        throw "String error";
      };

      container.register(token, { useFactory: asyncFactory });

      let errorCaught = false;
      try {
        await container.resolveAsync(token);

        expect(true).toBe(false);
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(Error);

        expect(error.message).toContain(
          `Failed to resolve dependency '${token}'`,
        );
      }
      expect(errorCaught).toBe(true);
    });

    it("should notify observers about async resolution", async () => {
      const observer = vi.fn();
      const token = "ASYNC_OBSERVABLE_TEST";
      const asyncFactory = async () => ({ value: "async-value" });

      container.register(token, { useFactory: asyncFactory });
      const unsubscribe = container.observe(observer);
      await container.resolveAsync(token);

      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("resolve");
      expect(event.token).toBe(token);
      expect(event.details.async).toBe(true);
    });

    it("should emit async error events with non-Error objects and convert them to strings", async () => {
      const observer = vi.fn();
      const token = "ASYNC_OBJECT_ERROR";
      const nonErrorValue = { custom: "async error object" };

      container.register(token, {
        useFactory: async () => {
          throw nonErrorValue;
        },
      });

      container.observe(observer);

      const originalEmitEvent = container["emitEvent"];
      container["emitEvent"] = vi.fn().mockImplementation((event) => {
        if (event.type === "error" && event.details.async) {
          event.details.error = nonErrorValue;
          event.details.message = String(nonErrorValue);
        }
        return originalEmitEvent.call(container, event);
      });

      try {
        await container.resolveAsync(token);
      } catch (error) {}

      container["emitEvent"] = originalEmitEvent;

      expect(observer).toHaveBeenCalledTimes(1);
      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("error");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();

      expect(event.details.message).toBeDefined();
      expect(event.details.async).toBe(true);
    });
  });

  describe("Parent-child container relationship", () => {
    it("should resolve dependencies from parent container", () => {
      const parentContainer = new Container({ name: "parent" });
      const childContainer = new Container({
        name: "child",
        parent: parentContainer,
      });

      const token = "PARENT_SERVICE";
      const value = "parent-value";

      parentContainer.register(token, { useValue: value });
      const resolved = childContainer.resolve(token);

      expect(resolved).toBe(value);
    });

    it("should prioritize child container registrations over parent", () => {
      const parentContainer = new Container({ name: "parent" });
      const childContainer = new Container({
        name: "child",
        parent: parentContainer,
      });

      const token = "OVERRIDDEN_SERVICE";
      const parentValue = "parent-value";
      const childValue = "child-value";

      parentContainer.register(token, { useValue: parentValue });
      childContainer.register(token, { useValue: childValue });

      const resolved = childContainer.resolve(token);

      expect(resolved).toBe(childValue);
    });

    it("should throw when token is not found in child or parent", () => {
      const parentContainer = new Container({ name: "parent" });
      const childContainer = new Container({
        name: "child",
        parent: parentContainer,
      });

      const token = "MISSING_SERVICE";

      expect(() => childContainer.resolve(token)).toThrow();
    });
  });

  describe("Promise caching", () => {
    it("should cache promises for method calls", async () => {
      const token = "PROMISE_SERVICE";
      let callCount = 0;

      class PromiseService {
        async fetchData() {
          callCount++;
          return { data: "test-data" };
        }
      }

      container.register(token, { useClass: PromiseService });

      const promise1 = container.getPromise(token, "fetchData");
      const promise2 = container.getPromise(token, "fetchData");

      const result1 = await promise1;
      const result2 = await promise2;

      expect(result1).toEqual({ data: "test-data" });
      expect(result2).toEqual({ data: "test-data" });
      expect(promise1).toBe(promise2);
      expect(callCount).toBe(1);
    });

    it("should throw when trying to get promise for non-existent method", () => {
      const token = "INVALID_PROMISE_SERVICE";

      class EmptyService {}

      container.register(token, { useClass: EmptyService });

      expect(() => {
        container.getPromise(token, "nonExistentMethod");
      }).toThrow();
    });

    it("should pass arguments to the method when getting promise", async () => {
      const token = "ARGS_PROMISE_SERVICE";

      class ArgsService {
        async fetchWithArgs(arg1: string, arg2: number) {
          return { arg1, arg2 };
        }
      }

      container.register(token, { useClass: ArgsService });

      const promise = container.getPromise(token, "fetchWithArgs", [
        "test",
        123,
      ]);
      const result = await promise;

      expect(result).toEqual({ arg1: "test", arg2: 123 });
    });
  });

  describe("Error handling", () => {
    it("should format Error objects correctly", () => {
      const errorMessage = "Test error message";
      const error = new Error(errorMessage);

      const result = container["formatErrorMessage"](error);

      expect(result).toBe(errorMessage);
    });

    it("should format non-Error objects correctly", () => {
      const nonErrorValues = [
        "string error",
        123,
        true,
        { custom: "error object" },
        [1, 2, 3],
        null,
        undefined,
      ];

      nonErrorValues.forEach((value) => {
        const result = container["formatErrorMessage"](value);
        expect(result).toBe(String(value));
      });
    });
  });

  describe("Container with immutable lifecycle", () => {
    it("should create and maintain immutable instances", () => {
      const TOKEN = Symbol("IMMUTABLE_SERVICE");
      let instanceCount = 0;

      class ImmutableService {
        id: number;
        constructor() {
          this.id = ++instanceCount;
        }
      }

      const container = new Container({
        providers: [
          {
            provide: TOKEN,
            useClass: ImmutableService,
            lifecycle: "immutable",
          },
        ],
      });

      const instance1 = container.resolve<ImmutableService>(TOKEN);
      const instance2 = container.resolve<ImmutableService>(TOKEN);

      container.invalidateCache(TOKEN);

      const instance3 = container.resolve<ImmutableService>(TOKEN);

      expect(instance1).toBe(instance2);
      expect(instance1).toBe(instance3);
      expect(instanceCount).toBe(1);
    });

    it("should not be affected by garbage collection", () => {
      const TOKEN = Symbol("GC_IMMUTABLE");
      let instanceCount = 0;

      class GCService {
        id: number;
        constructor() {
          this.id = ++instanceCount;
        }
      }

      const container = new Container();
      container.register(TOKEN, {
        useClass: GCService,
        lifecycle: "immutable",
      });

      const instance1 = container.resolve<GCService>(TOKEN);

      container.startGarbageCollector(0, 10);

      return new Promise<void>((resolve) => {
        setTimeout(() => {
          const instance2 = container.resolve<GCService>(TOKEN);

          expect(instance1).toBe(instance2);
          expect(instanceCount).toBe(1);

          container.stopGarbageCollector();
          resolve();
        }, 50);
      });
    });

    it("should maintain state between resolutions", () => {
      const TOKEN = Symbol("STATEFUL_SERVICE");

      class StatefulService {
        private count = 0;

        increment() {
          return ++this.count;
        }

        getCount() {
          return this.count;
        }
      }

      const container = new Container();
      container.register(TOKEN, {
        useClass: StatefulService,
        lifecycle: "immutable",
      });

      const instance1 = container.resolve<StatefulService>(TOKEN);
      instance1.increment();
      instance1.increment();

      const instance2 = container.resolve<StatefulService>(TOKEN);

      expect(instance2.getCount()).toBe(2);
      expect(instance2.increment()).toBe(3);
    });
  });

  describe("Immutable integrity", () => {
    it("should verify immutable integrity", () => {
      const TOKEN = Symbol("INTEGRITY_TEST");

      class IntegrityService {
        value = Math.random();
      }

      const container = new Container();
      container.register(TOKEN, {
        useClass: IntegrityService,
        lifecycle: "immutable",
      });

      const verifier = container.verifyImmutableIntegrity();

      const firstCheck = verifier(TOKEN);

      const secondCheck = verifier(TOKEN);

      expect(firstCheck).toBe(true);
      expect(secondCheck).toBe(true);
    });

    it("should detect immutable integrity violations", () => {
      const TOKEN = Symbol("INTEGRITY_VIOLATION");

      class ViolationService {
        value = Math.random();
      }

      const container = new Container();
      container.register(TOKEN, {
        useClass: ViolationService,
        lifecycle: "immutable",
      });

      const verifier = container.verifyImmutableIntegrity();

      verifier(TOKEN);

      const immutableInstances = (container["resolver"] as any)
        .immutableInstances;
      immutableInstances.set(TOKEN, new ViolationService());

      const errorSpy = vi.spyOn(Logger, "error");

      const result = verifier(TOKEN);

      expect(result).toBe(false);
      expect(errorSpy).toHaveBeenCalledWith(
        `Immutable integrity violated for ${Logger.formatToken(String(TOKEN))}`,
      );
    });

    it("should not log errors in production mode", () => {
      const TOKEN = Symbol("PROD_INTEGRITY");
      const originalNodeEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = "production";

      class ProdService {
        value = Math.random();
      }

      const container = new Container();
      container.register(TOKEN, {
        useClass: ProdService,
        lifecycle: "immutable",
      });

      const verifier = container.verifyImmutableIntegrity();

      verifier(TOKEN);

      const immutableInstances = (container["resolver"] as any)
        .immutableInstances;
      immutableInstances.set(TOKEN, new ProdService());

      const errorSpy = vi.spyOn(Logger, "error");

      const result = verifier(TOKEN);

      process.env.NODE_ENV = originalNodeEnv;

      expect(result).toBe(false);
      expect(errorSpy).not.toHaveBeenCalled();
    });
  });
});
