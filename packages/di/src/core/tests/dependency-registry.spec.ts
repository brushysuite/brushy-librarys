import { describe, it, expect, vi, beforeEach } from "vitest";
import { DependencyRegistry } from "../dependency-registry";
import { Token } from "../../lib/@types";

describe("DependencyRegistry", () => {
  let registry: DependencyRegistry;

  beforeEach(() => {
    registry = new DependencyRegistry();
  });

  describe("Provider registration", () => {
    it("should register a provider with useValue", () => {
      // Arrange
      const token = "TEST_TOKEN";
      const value = "test-value";

      // Act
      registry.register(token, { useValue: value });

      // Assert
      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)).toEqual({ useValue: value });
    });

    it("should register a provider with useClass", () => {
      // Arrange
      const token = "CLASS_TOKEN";
      class TestClass {}

      // Act
      registry.register(token, { useClass: TestClass });

      // Assert
      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)).toEqual({ useClass: TestClass });
    });

    it("should register a provider with useFactory", () => {
      // Arrange
      const token = "FACTORY_TOKEN";
      const factory = () => "factory-result";

      // Act
      registry.register(token, { useFactory: factory });

      // Assert
      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)?.useFactory).toBe(factory);
    });

    it("should register a provider with lifecycle option", () => {
      // Arrange
      const token = "LIFECYCLE_TOKEN";

      // Act
      registry.register(token, {
        useValue: "test",
        lifecycle: "transient",
      });

      // Assert
      expect(registry.getProvider(token)).toEqual({
        useValue: "test",
        lifecycle: "transient",
      });
    });

    it("should override existing provider when registering with the same token", () => {
      // Arrange
      const token = "OVERRIDE_TOKEN";

      // Act
      registry.register(token, { useValue: "original" });
      registry.register(token, { useValue: "overridden" });

      // Assert
      expect(registry.getProvider(token)).toEqual({ useValue: "overridden" });
    });
  });

  describe("Provider retrieval", () => {
    it("should return undefined for non-existent token", () => {
      // Arrange
      const token = "NON_EXISTENT";

      // Act & Assert
      expect(registry.getProvider(token)).toBeUndefined();
    });

    it("should check if a token exists", () => {
      // Arrange
      const token = "EXISTS_TOKEN";

      // Act & Assert
      expect(registry.has(token)).toBe(false);

      registry.register(token, { useValue: "exists" });
      expect(registry.has(token)).toBe(true);
    });
  });

  describe("Provider collection", () => {
    it("should get all registered providers", () => {
      // Arrange
      const token1 = "TOKEN_1";
      const token2 = "TOKEN_2";

      registry.register(token1, { useValue: "value1" });
      registry.register(token2, { useValue: "value2" });

      // Act
      const providers = registry.getAllProviders();

      // Assert
      expect(providers).toHaveLength(2);
      expect(providers).toContainEqual({
        token: token1,
        config: { useValue: "value1" },
      });
      expect(providers).toContainEqual({
        token: token2,
        config: { useValue: "value2" },
      });
    });

    it("should get all registered tokens", () => {
      // Arrange
      const token1 = "TOKEN_1";
      const token2 = Symbol("TOKEN_2");

      registry.register(token1, { useValue: "value1" });
      registry.register(token2, { useValue: "value2" });

      // Act
      const tokens = registry.getAllTokens();

      // Assert
      expect(tokens).toHaveLength(2);
      expect(tokens).toContain(token1);
      expect(tokens).toContain(token2);
    });

    it("should return empty arrays when no providers are registered", () => {
      // Act & Assert
      expect(registry.getAllProviders()).toEqual([]);
      expect(registry.getAllTokens()).toEqual([]);
    });
  });

  describe("Symbol tokens", () => {
    it("should work with Symbol tokens", () => {
      // Arrange
      const token = Symbol("SYMBOL_TOKEN");

      // Act
      registry.register(token, { useValue: "symbol-value" });

      // Assert
      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)).toEqual({ useValue: "symbol-value" });
    });
  });

  describe("Class tokens", () => {
    it("should work with class tokens", () => {
      // Arrange
      class TokenClass {}

      // Act
      registry.register(TokenClass, { useValue: "class-value" });

      // Assert
      expect(registry.has(TokenClass)).toBe(true);
      expect(registry.getProvider(TokenClass)).toEqual({
        useValue: "class-value",
      });
    });
  });

  describe("Complex configurations", () => {
    it("should handle complex provider configurations", () => {
      // Arrange
      const token = "COMPLEX_TOKEN";
      class TestService {}
      const dependencies = ["DEP1", "DEP2"];

      // Act
      registry.register(token, {
        useClass: TestService,
        lifecycle: "singleton",
        ttl: 60000,
        dependencies,
      });

      // Assert
      expect(registry.getProvider(token)).toEqual({
        useClass: TestService,
        lifecycle: "singleton",
        ttl: 60000,
        dependencies,
      });
    });
  });
});
