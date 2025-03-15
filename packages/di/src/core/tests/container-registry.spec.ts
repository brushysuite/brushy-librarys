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
      registry.registerContainer(scope, container);
      const retrievedContainer = registry.getContainer(scope);

      expect(retrievedContainer).toBe(container);
    });

    it("should set a default container", () => {
      registry.setDefaultContainer(container);
      const retrievedContainer = registry.getContainer();

      expect(retrievedContainer).toBe(container);
    });

    it("should check if a default container exists", () => {
      expect(registry.hasDefaultContainer()).toBe(false);

      registry.setDefaultContainer(container);
      expect(registry.hasDefaultContainer()).toBe(true);
    });

    it("should throw an error when no container is found", () => {
      expect(() => registry.getContainer()).toThrow(DependencyError);
      expect(() => registry.getContainer(scope)).toThrow(DependencyError);
    });
  });

  describe("Container caching and optimization", () => {
    it("should cache the last used container for quick access", () => {
      registry.registerContainer(scope, container);

      registry.getContainer(scope);
      const lastScope = registry["lastScope"];
      const lastContainer = registry["lastContainer"];

      expect(lastScope).toBe(scope);
      expect(lastContainer).toBe(container);

      registry.getContainer(scope);
    });

    it("should use the default container when no scope is provided", () => {
      registry.setDefaultContainer(container);

      const retrievedContainer = registry.getContainer();

      expect(retrievedContainer).toBe(container);
    });

    it("should retrieve container from scopedContainers and update last references", () => {
      const transientScope = { constructor: { name: "HttpRequest" } };
      const transientContainer = new Container({ name: "transient-container" });

      registry.registerContainer(transientScope, transientContainer);

      registry["lastScope"] = null;
      registry["lastContainer"] = null;

      const retrievedContainer = registry.getContainer(transientScope);

      expect(retrievedContainer).toBe(transientContainer);
      expect(registry["lastScope"]).toBe(transientScope);
      expect(registry["lastContainer"]).toBe(transientContainer);
      expect(registry["scopedContainers"].get(transientScope)).toBe(
        transientContainer,
      );
    });

    it("should retrieve container from weakScopedContainers and update last references", () => {
      const permanentScope = {
        id: "permanent",
        constructor: { name: "PermanentScope" },
      };
      const permanentContainer = new Container({ name: "permanent-container" });

      registry.registerContainer(permanentScope, permanentContainer);

      registry["lastScope"] = null;
      registry["lastContainer"] = null;

      const retrievedContainer = registry.getContainer(permanentScope);

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
      const requestScope = { constructor: { name: "HttpRequest" } };
      const container = new Container({ name: "request-container" });

      registry.registerContainer(requestScope, container);

      expect(registry["scopedContainers"].has(requestScope)).toBe(true);
    });

    it("should detect Temporary objects as transient scopes", () => {
      const temporaryScope = { constructor: { name: "TemporaryContext" } };
      const container = new Container({ name: "temporary-container" });

      registry.registerContainer(temporaryScope, container);

      expect(registry["scopedContainers"].has(temporaryScope)).toBe(true);
    });

    it("should detect empty objects as transient scopes", () => {
      const emptyScope = {};
      const container = new Container({ name: "empty-container" });

      registry.registerContainer(emptyScope, container);

      expect(registry["scopedContainers"].has(emptyScope)).toBe(true);
    });

    it("should treat regular objects as non-transient scopes", () => {
      const regularScope = { id: "regular", constructor: { name: "Object" } };
      const container = new Container({ name: "regular-container" });

      registry.registerContainer(regularScope, container);

      expect(registry["weakScopedContainers"].has(regularScope)).toBe(true);
      expect(registry["scopedContainers"].has(regularScope)).toBe(false);
    });
  });

  describe("Cleanup of transient scopes", () => {
    it("should clean up all transient scopes", () => {
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

      registry.cleanupTransientScopes();

      expect(registry["scopedContainers"].size).toBe(0);
      expect(registry["weakScopedContainers"].has(regularScope)).toBe(true);
      expect(() => registry.getContainer(requestScope)).toThrow();
      expect(() => registry.getContainer(temporaryScope)).toThrow();
    });

    it("should reset last scope and container references when cleaning up", () => {
      const requestScope = { constructor: { name: "HttpRequest" } };
      const container = new Container({ name: "request" });

      registry.registerContainer(requestScope, container);
      registry.getContainer(requestScope);

      registry.cleanupTransientScopes();

      expect(registry["lastScope"]).toBe(null);
      expect(registry["lastContainer"]).toBe(null);
    });
  });

  describe("Edge cases", () => {
    it("should handle multiple registrations for the same scope", () => {
      const firstContainer = new Container({ name: "first" });
      const secondContainer = new Container({ name: "second" });

      registry.registerContainer(scope, firstContainer);
      registry.registerContainer(scope, secondContainer);

      expect(registry.getContainer(scope)).toBe(secondContainer);
    });

    it("should handle WeakMap garbage collection gracefully", () => {
      let dynamicScope = { id: "dynamic" };
      registry.registerContainer(dynamicScope, container);

      dynamicScope = { id: "new-dynamic" };
      expect(() => registry.getContainer(dynamicScope)).toThrow();
    });
  });
});
