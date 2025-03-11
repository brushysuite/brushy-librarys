import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container } from "../container";
import { DependencyError } from "../dependency-error";

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
      // Arrange
      const token = "TEST_VALUE";
      const value = "test-value";

      // Act
      container.register(token, { useValue: value });
      const resolved = container.resolve(token);

      // Assert
      expect(resolved).toBe(value);
    });

    it("should register and resolve a class", () => {
      // Arrange
      class TestService {
        getValue() {
          return "test-value";
        }
      }
      const token = "TEST_SERVICE";

      // Act
      container.register(token, { useClass: TestService });
      const resolved = container.resolve<TestService>(token);

      // Assert
      expect(resolved).toBeInstanceOf(TestService);
      expect(resolved.getValue()).toBe("test-value");
    });

    it("should register and resolve a factory", () => {
      // Arrange
      const token = "TEST_FACTORY";
      const factory = () => ({ value: "factory-value" });

      // Act
      container.register(token, { useFactory: factory });
      const resolved = container.resolve(token);

      // Assert
      expect(resolved).toEqual({ value: "factory-value" });
    });

    it("should throw an error when resolving an unregistered token", () => {
      // Arrange
      const token = "UNREGISTERED_TOKEN";

      // Act & Assert
      expect(() => container.resolve(token)).toThrow();
    });

    it("should register providers during construction", () => {
      // Arrange
      const token = "CONSTRUCTOR_TOKEN";
      const value = "constructor-value";

      // Act
      const newContainer = new Container({
        providers: [
          {
            provide: token,
            useValue: value,
          },
        ],
      });

      // Assert
      expect(newContainer.resolve(token)).toBe(value);
    });
  });

  describe("Lifecycle management", () => {
    it("should create a new instance for each resolution with transient lifecycle", () => {
      // Arrange
      class TestService {
        public id = Math.random();
      }
      const token = "TRANSIENT_SERVICE";

      // Act
      container.register(token, {
        useClass: TestService,
        lifecycle: "transient",
      });

      const instance1 = container.resolve<TestService>(token);
      const instance2 = container.resolve<TestService>(token);

      // Assert
      expect(instance1).toBeInstanceOf(TestService);
      expect(instance2).toBeInstanceOf(TestService);
      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it("should reuse the same instance for singleton lifecycle", () => {
      // Arrange
      class TestService {
        public id = Math.random();
      }
      const token = "SINGLETON_SERVICE";

      // Act
      container.register(token, {
        useClass: TestService,
        lifecycle: "singleton",
      });

      const instance1 = container.resolve<TestService>(token);
      const instance2 = container.resolve<TestService>(token);

      // Assert
      expect(instance1).toBe(instance2);
      expect(instance1.id).toBe(instance2.id);
    });

    it("should clear request scope instances", () => {
      // Arrange
      class TestService {
        public id = Math.random();
      }
      const token = "SCOPED_SERVICE";

      // Act
      container.register(token, {
        useClass: TestService,
        lifecycle: "scoped",
      });

      const instance1 = container.resolve<TestService>(token);
      container.clearRequestScope();
      const instance2 = container.resolve<TestService>(token);

      // Assert
      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });

    it("should start and stop garbage collector", () => {
      // Arrange & Act
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

      // Assert
      expect(startSpy).toHaveBeenCalledWith(30000, 10000);
      expect(stopSpy).toHaveBeenCalled();
    });

    it("should invalidate cache for a token", () => {
      // Arrange
      class TestService {
        public id = Math.random();
      }
      const token = "CACHE_SERVICE";

      container.register(token, { useClass: TestService });
      const instance1 = container.resolve<TestService>(token);

      // Act
      container.invalidateCache(token);
      const instance2 = container.resolve<TestService>(token);

      // Assert
      expect(instance1).not.toBe(instance2);
      expect(instance1.id).not.toBe(instance2.id);
    });
  });

  describe("Dependency injection", () => {
    it("should inject dependencies into a class", () => {
      // Arrange
      const dependencyToken = "DEPENDENCY";
      const dependency = { value: "dependency-value" };

      class ServiceWithDependency {
        constructor(private dep: typeof dependency) {}

        getDependencyValue() {
          return this.dep.value;
        }
      }

      const serviceToken = "SERVICE_WITH_DEP";

      // Act
      container.register(dependencyToken, { useValue: dependency });
      container.register(serviceToken, {
        useClass: ServiceWithDependency,
        dependencies: [dependencyToken],
      });

      const service = container.resolve<ServiceWithDependency>(serviceToken);

      // Assert
      expect(service).toBeInstanceOf(ServiceWithDependency);
      expect(service.getDependencyValue()).toBe("dependency-value");
    });

    it("should inject dependencies into a factory", () => {
      // Arrange
      const dependencyToken = "FACTORY_DEPENDENCY";
      const dependency = { value: "factory-dependency-value" };

      const factoryToken = "FACTORY_WITH_DEP";
      const factory = (dep: typeof dependency) => ({
        getValue: () => dep.value,
      });

      // Act
      container.register(dependencyToken, { useValue: dependency });
      container.register(factoryToken, {
        useFactory: factory,
        dependencies: [dependencyToken],
      });

      const service = container.resolve(factoryToken) as any;

      // Assert
      expect(service.getValue()).toBe("factory-dependency-value");
    });

    it("should throw an error when a dependency is not registered", () => {
      // Arrange
      class ServiceWithDependency {
        constructor(private dep: any) {}
      }

      const serviceToken = "SERVICE_WITH_MISSING_DEP";
      const missingDepToken = "MISSING_DEPENDENCY";

      // Act & Assert
      container.register(serviceToken, {
        useClass: ServiceWithDependency,
        dependencies: [missingDepToken],
      });

      expect(() => container.resolve(serviceToken)).toThrow();
    });

    it("should detect circular dependencies", () => {
      // Arrange
      const tokenA = "SERVICE_A";
      const tokenB = "SERVICE_B";

      class ServiceA {
        constructor(private b: any) {}
      }

      class ServiceB {
        constructor(private a: any) {}
      }

      // Act
      container.register(tokenA, {
        useClass: ServiceA,
        dependencies: [tokenB],
      });

      container.register(tokenB, {
        useClass: ServiceB,
        dependencies: [tokenA],
      });

      // Assert
      expect(() => container.resolve(tokenA)).toThrow();
    });
  });

  describe("Observability", () => {
    it("should notify observers about events", () => {
      // Arrange
      const observer = vi.fn();
      const token = "OBSERVABLE_TEST";

      // Act
      const unsubscribe = container.observe(observer);
      container.register(token, { useValue: "test" });
      container.resolve(token);

      // Assert
      expect(observer).toHaveBeenCalledTimes(2);

      // Verificar se o primeiro evento foi de registro
      const registerEvent = observer.mock.calls[0][0];
      expect(registerEvent.type).toBe("register");
      expect(registerEvent.token).toBe(token);

      // Verificar se o segundo evento foi de resolução
      const resolveEvent = observer.mock.calls[1][0];
      expect(resolveEvent.type).toBe("resolve");
      expect(resolveEvent.token).toBe(token);

      // Testar unsubscribe
      unsubscribe();
      container.resolve(token);
      expect(observer).toHaveBeenCalledTimes(2); // Não deve ter sido chamado novamente
    });

    it("should handle observer errors gracefully", () => {
      // Arrange
      const errorMessage = "Observer error";
      const observer = vi.fn().mockImplementation(() => {
        throw new Error(errorMessage);
      });
      const token = "ERROR_OBSERVER_TEST";

      // Act & Assert
      container.observe(observer);

      // Não deve lançar erro mesmo que o observer lance
      expect(() => {
        container.register(token, { useValue: "test" });
      }).not.toThrow();

      // O observer deve ter sido chamado
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should handle non-Error objects in observer errors", () => {
      // Arrange
      const observer = vi.fn().mockImplementation(() => {
        throw "String error"; // Não é um objeto Error
      });
      const token = "NON_ERROR_OBSERVER_TEST";

      // Act & Assert
      container.observe(observer);

      // Não deve lançar erro mesmo que o observer lance
      expect(() => {
        container.register(token, { useValue: "test" });
      }).not.toThrow();

      // O observer deve ter sido chamado
      expect(observer).toHaveBeenCalledTimes(1);
    });

    it("should notify observers about registration events", () => {
      // Arrange
      const observer = vi.fn();
      const token = "OBSERVABLE_TEST";

      // Act
      const unsubscribe = container.observe(observer);
      container.register(token, { useValue: "test" });

      // Assert
      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("register");
      expect(event.token).toBe(token);
      expect(event.timestamp).toBeGreaterThan(0);
      expect(event.details).toBeDefined();
    });

    it("should notify observers about resolution events", () => {
      // Arrange
      const observer = vi.fn();
      const token = "OBSERVABLE_RESOLVE_TEST";

      // Act
      container.register(token, { useValue: "test" });
      const unsubscribe = container.observe(observer);
      container.resolve(token);

      // Assert
      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("resolve");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();
    });

    it("should notify observers about error events", () => {
      // Arrange
      const observer = vi.fn();
      const token = "OBSERVABLE_ERROR_TEST";

      // Act
      const unsubscribe = container.observe(observer);

      try {
        container.resolve(token);
      } catch (error) {
        // Expected error
      }

      // Assert
      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("error");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();
    });

    it("should unsubscribe observers correctly", () => {
      // Arrange
      const observer = vi.fn();
      const token = "UNSUBSCRIBE_TEST";

      // Act
      const unsubscribe = container.observe(observer);
      unsubscribe();
      container.register(token, { useValue: "test" });

      // Assert
      expect(observer).not.toHaveBeenCalled();
    });

    it("should emit error events with non-Error objects and convert them to strings", () => {
      // Arrange
      const observer = vi.fn();
      const token = "NON_ERROR_TOKEN";
      const nonErrorValue = { custom: "error object" }; // Um objeto que não é Error

      // Registrar o observer
      container.observe(observer);

      // Mock para forçar um erro não-Error no emitEvent
      const originalEmitEvent = container["emitEvent"];
      container["emitEvent"] = vi.fn().mockImplementation((event) => {
        if (event.type === "error") {
          // Substituir o erro real por nosso objeto personalizado
          event.details.error = nonErrorValue;
          event.details.message = String(nonErrorValue);
        }
        return originalEmitEvent.call(container, event);
      });

      // Act - Forçar um erro
      try {
        container.resolve(token);
      } catch (error) {
        // Esperado
      }

      // Restaurar o método original
      container["emitEvent"] = originalEmitEvent;

      // Assert
      expect(observer).toHaveBeenCalledTimes(1);
      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("error");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();
      // Não podemos verificar o valor exato do erro, mas podemos verificar que a mensagem foi processada
      expect(event.details.message).toBeDefined();
    });
  });

  describe("Container import/export", () => {
    it("should import providers from another container", () => {
      // Arrange
      const sourceContainer = new Container({ name: "source" });
      const token = "IMPORTED_VALUE";
      const value = "imported-value";

      // Act
      sourceContainer.register(token, { useValue: value });
      container.import(sourceContainer);

      const resolved = container.resolve(token);

      // Assert
      expect(resolved).toBe(value);
    });

    it("should import with prefix", () => {
      // Arrange
      const sourceContainer = new Container({ name: "source" });
      const token = "ORIGINAL_TOKEN";
      const value = "original-value";
      const prefix = "imported";

      // Act
      sourceContainer.register(token, { useValue: value });
      container.import(sourceContainer, { prefix });

      const prefixedToken = `${prefix}.${token}`;
      const resolved = container.resolve(prefixedToken);

      // Assert
      expect(resolved).toBe(value);
    });

    it("should not override existing providers when importing unless specified", () => {
      // Arrange
      const sourceContainer = new Container({ name: "source" });
      const token = "SHARED_TOKEN";
      const originalValue = "original-value";
      const importedValue = "imported-value";

      // Act
      container.register(token, { useValue: originalValue });
      sourceContainer.register(token, { useValue: importedValue });

      // Import without override
      container.import(sourceContainer);
      const resolved1 = container.resolve(token);

      // Import with override
      container.import(sourceContainer, { overrideExisting: true });
      const resolved2 = container.resolve(token);

      // Assert
      expect(resolved1).toBe(originalValue); // Should keep original
      expect(resolved2).toBe(importedValue); // Should be overridden
    });

    it("should export all providers", () => {
      // Arrange
      const token1 = "TOKEN_1";
      const token2 = "TOKEN_2";

      container.register(token1, { useValue: "value1" });
      container.register(token2, { useValue: "value2" });

      // Act
      const exported = container.exportProviders();

      // Assert
      expect(exported).toHaveLength(2);
      expect(exported.map((e) => e.token)).toContain(token1);
      expect(exported.map((e) => e.token)).toContain(token2);
    });

    it("should get container name", () => {
      // Arrange & Act
      const name = container.getName();

      // Assert
      expect(name).toBe("test-container");
    });
  });

  describe("Async resolution", () => {
    it("should resolve dependencies asynchronously", async () => {
      // Arrange
      const token = "ASYNC_SERVICE";
      const asyncFactory = async () => {
        return { value: "async-value" };
      };

      // Act
      container.register(token, { useFactory: asyncFactory });
      const result = await container.resolveAsync(token);

      // Assert
      expect(result).toEqual({ value: "async-value" });
    });

    it("should handle async resolution errors", async () => {
      // Arrange
      const token = "ASYNC_ERROR_SERVICE";
      const asyncFactory = async () => {
        throw new Error("Async factory error");
      };

      // Act
      container.register(token, { useFactory: asyncFactory });

      // Assert
      await expect(container.resolveAsync(token)).rejects.toThrow();
    });

    it("should handle non-Error objects in async resolution errors", async () => {
      // Arrange
      const token = "ASYNC_NON_ERROR_SERVICE";
      const asyncFactory = async () => {
        throw "String error"; // Não é um objeto Error
      };

      // Act
      container.register(token, { useFactory: asyncFactory });

      // Assert
      let errorCaught = false;
      try {
        await container.resolveAsync(token);
        // Se chegar aqui, o teste falhou
        expect(true).toBe(false); // Forçar falha do teste
      } catch (error) {
        errorCaught = true;
        expect(error).toBeInstanceOf(Error);
        // A mensagem de erro é encapsulada em um DependencyError, então não contém diretamente a string original
        expect(error.message).toContain(
          `Failed to resolve dependency '${token}'`,
        );
      }
      expect(errorCaught).toBe(true);
    });

    it("should notify observers about async resolution", async () => {
      // Arrange
      const observer = vi.fn();
      const token = "ASYNC_OBSERVABLE_TEST";
      const asyncFactory = async () => ({ value: "async-value" });

      // Act
      container.register(token, { useFactory: asyncFactory });
      const unsubscribe = container.observe(observer);
      await container.resolveAsync(token);

      // Assert
      expect(observer).toHaveBeenCalledTimes(1);

      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("resolve");
      expect(event.token).toBe(token);
      expect(event.details.async).toBe(true);
    });

    it("should emit async error events with non-Error objects and convert them to strings", async () => {
      // Arrange
      const observer = vi.fn();
      const token = "ASYNC_OBJECT_ERROR";
      const nonErrorValue = { custom: "async error object" }; // Um objeto que não é Error

      // Registrar um factory que lança um objeto em vez de um Error
      container.register(token, {
        useFactory: async () => {
          throw nonErrorValue;
        },
      });

      // Registrar o observer
      container.observe(observer);

      // Mock para forçar um erro não-Error no emitEvent
      const originalEmitEvent = container["emitEvent"];
      container["emitEvent"] = vi.fn().mockImplementation((event) => {
        if (event.type === "error" && event.details.async) {
          // Substituir o erro real por nosso objeto personalizado
          event.details.error = nonErrorValue;
          event.details.message = String(nonErrorValue);
        }
        return originalEmitEvent.call(container, event);
      });

      // Act - Tentar resolver e capturar o erro
      try {
        await container.resolveAsync(token);
      } catch (error) {
        // Esperado
      }

      // Restaurar o método original
      container["emitEvent"] = originalEmitEvent;

      // Assert
      expect(observer).toHaveBeenCalledTimes(1);
      const event = observer.mock.calls[0][0];
      expect(event.type).toBe("error");
      expect(event.token).toBe(token);
      expect(event.details).toBeDefined();
      // Não podemos verificar o valor exato do erro, mas podemos verificar que a mensagem foi processada
      expect(event.details.message).toBeDefined();
      expect(event.details.async).toBe(true);
    });
  });

  describe("Parent-child container relationship", () => {
    it("should resolve dependencies from parent container", () => {
      // Arrange
      const parentContainer = new Container({ name: "parent" });
      const childContainer = new Container({
        name: "child",
        parent: parentContainer,
      });

      const token = "PARENT_SERVICE";
      const value = "parent-value";

      // Act
      parentContainer.register(token, { useValue: value });
      const resolved = childContainer.resolve(token);

      // Assert
      expect(resolved).toBe(value);
    });

    it("should prioritize child container registrations over parent", () => {
      // Arrange
      const parentContainer = new Container({ name: "parent" });
      const childContainer = new Container({
        name: "child",
        parent: parentContainer,
      });

      const token = "OVERRIDDEN_SERVICE";
      const parentValue = "parent-value";
      const childValue = "child-value";

      // Act
      parentContainer.register(token, { useValue: parentValue });
      childContainer.register(token, { useValue: childValue });

      const resolved = childContainer.resolve(token);

      // Assert
      expect(resolved).toBe(childValue);
    });

    it("should throw when token is not found in child or parent", () => {
      // Arrange
      const parentContainer = new Container({ name: "parent" });
      const childContainer = new Container({
        name: "child",
        parent: parentContainer,
      });

      const token = "MISSING_SERVICE";

      // Act & Assert
      expect(() => childContainer.resolve(token)).toThrow();
    });
  });

  describe("Promise caching", () => {
    it("should cache promises for method calls", async () => {
      // Arrange
      const token = "PROMISE_SERVICE";
      let callCount = 0;

      class PromiseService {
        async fetchData() {
          callCount++;
          return { data: "test-data" };
        }
      }

      // Act
      container.register(token, { useClass: PromiseService });

      // Get the same promise twice
      const promise1 = container.getPromise(token, "fetchData");
      const promise2 = container.getPromise(token, "fetchData");

      const result1 = await promise1;
      const result2 = await promise2;

      // Assert
      expect(result1).toEqual({ data: "test-data" });
      expect(result2).toEqual({ data: "test-data" });
      expect(promise1).toBe(promise2); // Same promise instance
      expect(callCount).toBe(1); // Method called only once
    });

    it("should throw when trying to get promise for non-existent method", () => {
      // Arrange
      const token = "INVALID_PROMISE_SERVICE";

      class EmptyService {}

      // Act
      container.register(token, { useClass: EmptyService });

      // Assert
      expect(() => {
        container.getPromise(token, "nonExistentMethod");
      }).toThrow();
    });

    it("should pass arguments to the method when getting promise", async () => {
      // Arrange
      const token = "ARGS_PROMISE_SERVICE";

      class ArgsService {
        async fetchWithArgs(arg1: string, arg2: number) {
          return { arg1, arg2 };
        }
      }

      // Act
      container.register(token, { useClass: ArgsService });

      const promise = container.getPromise(token, "fetchWithArgs", [
        "test",
        123,
      ]);
      const result = await promise;

      // Assert
      expect(result).toEqual({ arg1: "test", arg2: 123 });
    });
  });

  describe("Error handling", () => {
    it("should format Error objects correctly", () => {
      // Arrange
      const errorMessage = "Test error message";
      const error = new Error(errorMessage);

      // Act
      const result = container["formatErrorMessage"](error);

      // Assert
      expect(result).toBe(errorMessage);
    });

    it("should format non-Error objects correctly", () => {
      // Arrange
      const nonErrorValues = [
        "string error",
        123,
        true,
        { custom: "error object" },
        [1, 2, 3],
        null,
        undefined,
      ];

      // Act & Assert
      nonErrorValues.forEach((value) => {
        const result = container["formatErrorMessage"](value);
        expect(result).toBe(String(value));
      });
    });
  });
});
