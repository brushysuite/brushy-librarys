import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContainerRegistry } from "../container-registry";
import { Container } from "../container";
import { DependencyError } from "../dependency-error";

describe("ContainerRegistry", () => {
  let registry: ContainerRegistry;
  let container: Container;
  let scope: object;

  beforeEach(() => {
    registry = new ContainerRegistry();
    container = new Container({ name: "test-container" });
    scope = { id: "test-scope" };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Container registration", () => {
    it("should register a container for a scope", () => {
      // Act
      registry.registerContainer(scope, container);
      const retrievedContainer = registry.getContainer(scope);

      // Assert
      expect(retrievedContainer).toBe(container);
    });

    it("should set a default container", () => {
      // Act
      registry.setDefaultContainer(container);
      const retrievedContainer = registry.getContainer();

      // Assert
      expect(retrievedContainer).toBe(container);
    });

    it("should check if a default container exists", () => {
      // Act & Assert
      expect(registry.hasDefaultContainer()).toBe(false);

      registry.setDefaultContainer(container);
      expect(registry.hasDefaultContainer()).toBe(true);
    });

    it("should throw an error when no container is found", () => {
      // Act & Assert
      expect(() => registry.getContainer()).toThrow(DependencyError);
      expect(() => registry.getContainer(scope)).toThrow(DependencyError);
    });
  });

  describe("Container caching and optimization", () => {
    it("should cache the last used container for quick access", () => {
      // Arrange
      registry.registerContainer(scope, container);

      // Act
      registry.getContainer(scope); // First access
      const lastScope = registry["lastScope"];
      const lastContainer = registry["lastContainer"];

      // Assert
      expect(lastScope).toBe(scope);
      expect(lastContainer).toBe(container);

      // Second access should use the cached values
      registry.getContainer(scope);
    });

    it("should use the default container when no scope is provided", () => {
      // Arrange
      registry.setDefaultContainer(container);

      // Act
      const retrievedContainer = registry.getContainer();

      // Assert
      expect(retrievedContainer).toBe(container);
    });

    it("should retrieve container from scopedContainers and update last references", () => {
      // Arrange
      const transientScope = { constructor: { name: "HttpRequest" } };
      const transientContainer = new Container({ name: "transient-container" });

      // Register the container in scopedContainers
      registry.registerContainer(transientScope, transientContainer);

      // Reset last references
      registry["lastScope"] = null;
      registry["lastContainer"] = null;

      // Act
      const retrievedContainer = registry.getContainer(transientScope);

      // Assert
      expect(retrievedContainer).toBe(transientContainer);
      expect(registry["lastScope"]).toBe(transientScope);
      expect(registry["lastContainer"]).toBe(transientContainer);
      expect(registry["scopedContainers"].get(transientScope)).toBe(
        transientContainer,
      );
    });

    it("should retrieve container from weakScopedContainers and update last references", () => {
      // Arrange
      const permanentScope = {
        id: "permanent",
        constructor: { name: "PermanentScope" },
      };
      const permanentContainer = new Container({ name: "permanent-container" });

      // Register the container in weakScopedContainers
      registry.registerContainer(permanentScope, permanentContainer);

      // Reset last references
      registry["lastScope"] = null;
      registry["lastContainer"] = null;

      // Act
      const retrievedContainer = registry.getContainer(permanentScope);

      // Assert
      expect(retrievedContainer).toBe(permanentContainer);
      expect(registry["lastScope"]).toBe(permanentScope);
      expect(registry["lastContainer"]).toBe(permanentContainer);
      expect(registry["weakScopedContainers"].get(permanentScope)).toBe(
        permanentContainer,
      );
    });
  });

  describe("Transient scope detection", () => {
    it("should detect Request objects as transient scopes", () => {
      // Arrange
      const requestScope = { constructor: { name: "HttpRequest" } };
      const container = new Container({ name: "request-container" });

      // Act
      registry.registerContainer(requestScope, container);

      // Assert - Indirectly testing isTransientScope by checking if it's stored in scopedContainers
      expect(registry["scopedContainers"].has(requestScope)).toBe(true);
    });

    it("should detect Temporary objects as transient scopes", () => {
      // Arrange
      const temporaryScope = { constructor: { name: "TemporaryContext" } };
      const container = new Container({ name: "temporary-container" });

      // Act
      registry.registerContainer(temporaryScope, container);

      // Assert
      expect(registry["scopedContainers"].has(temporaryScope)).toBe(true);
    });

    it("should detect empty objects as transient scopes", () => {
      // Arrange
      const emptyScope = {};
      const container = new Container({ name: "empty-container" });

      // Act
      registry.registerContainer(emptyScope, container);

      // Assert
      expect(registry["scopedContainers"].has(emptyScope)).toBe(true);
    });

    it("should treat regular objects as non-transient scopes", () => {
      // Arrange
      const regularScope = { id: "regular", constructor: { name: "Object" } };
      const container = new Container({ name: "regular-container" });

      // Act
      registry.registerContainer(regularScope, container);

      // Assert
      expect(registry["weakScopedContainers"].has(regularScope)).toBe(true);
      expect(registry["scopedContainers"].has(regularScope)).toBe(false);
    });
  });

  describe("Cleanup of transient scopes", () => {
    it("should clean up all transient scopes", () => {
      // Arrange
      const requestScope = { constructor: { name: "HttpRequest" } };
      const temporaryScope = { constructor: { name: "TemporaryContext" } };
      const regularScope = { id: "regular" };

      registry.registerContainer(
        requestScope,
        new Container({ name: "request" }),
      );
      registry.registerContainer(
        temporaryScope,
        new Container({ name: "temporary" }),
      );
      registry.registerContainer(
        regularScope,
        new Container({ name: "regular" }),
      );

      // Act
      registry.cleanupTransientScopes();

      // Assert
      expect(registry["scopedContainers"].size).toBe(0);
      expect(registry["weakScopedContainers"].has(regularScope)).toBe(true);
      expect(() => registry.getContainer(requestScope)).toThrow();
      expect(() => registry.getContainer(temporaryScope)).toThrow();
    });

    it("should reset last scope and container references when cleaning up", () => {
      // Arrange
      const requestScope = { constructor: { name: "HttpRequest" } };
      const container = new Container({ name: "request" });

      registry.registerContainer(requestScope, container);
      registry.getContainer(requestScope); // Set last scope and container

      // Act
      registry.cleanupTransientScopes();

      // Assert
      expect(registry["lastScope"]).toBe(null);
      expect(registry["lastContainer"]).toBe(null);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple registrations for the same scope", () => {
      // Arrange
      const firstContainer = new Container({ name: "first" });
      const secondContainer = new Container({ name: "second" });

      // Act
      registry.registerContainer(scope, firstContainer);
      registry.registerContainer(scope, secondContainer);

      // Assert
      expect(registry.getContainer(scope)).toBe(secondContainer);
    });

    it("should handle WeakMap garbage collection gracefully", () => {
      // This test is more conceptual since we can't directly test GC
      // But we can verify the code doesn't throw when accessing a potentially collected reference

      // Arrange
      let dynamicScope = { id: "dynamic" };
      registry.registerContainer(dynamicScope, container);

      // Act & Assert - No error should be thrown
      dynamicScope = { id: "new-dynamic" }; // Original reference is now eligible for GC
      expect(() => registry.getContainer(dynamicScope)).toThrow(); // Should throw "no container found"
    });
  });
});
