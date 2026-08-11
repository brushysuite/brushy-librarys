import { describe, it, expect, beforeEach } from "vitest";
import { DependencyRegistry } from "../dependency-registry";

describe("DependencyRegistry", () => {
  let registry: DependencyRegistry;

  beforeEach(() => {
    registry = new DependencyRegistry();
  });

  describe("Provider registration", () => {
    it("should register a provider with useValue", () => {
      const token = "TEST_TOKEN";
      const value = "test-value";

      registry.register(token, { useValue: value });

      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)).toEqual({ useValue: value });
    });

    it("should register a provider with useClass", () => {
      const token = "CLASS_TOKEN";
      class TestClass {}

      registry.register(token, { useClass: TestClass });

      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)).toEqual({ useClass: TestClass });
    });

    it("should register a provider with useFactory", () => {
      const token = "FACTORY_TOKEN";
      const factory = () => "factory-result";

      registry.register(token, { useFactory: factory });

      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)?.useFactory).toBe(factory);
    });

    it("should register a provider with lifecycle option", () => {
      const token = "LIFECYCLE_TOKEN";

      registry.register(token, {
        useValue: "test",
        lifecycle: "transient",
      });

      expect(registry.getProvider(token)).toEqual({
        useValue: "test",
        lifecycle: "transient",
      });
    });

    it("should override existing provider when registering with the same token", () => {
      const token = "OVERRIDE_TOKEN";

      registry.register(token, { useValue: "original" });
      registry.register(token, { useValue: "overridden" });

      expect(registry.getProvider(token)).toEqual({ useValue: "overridden" });
    });
  });

  describe("Provider retrieval", () => {
    it("should return undefined for non-existent token", () => {
      const token = "NON_EXISTENT";

      expect(registry.getProvider(token)).toBeUndefined();
    });

    it("should check if a token exists", () => {
      const token = "EXISTS_TOKEN";

      expect(registry.has(token)).toBe(false);

      registry.register(token, { useValue: "exists" });
      expect(registry.has(token)).toBe(true);
    });
  });

  describe("Provider collection", () => {
    it("should get all registered providers", () => {
      const token1 = "TOKEN_1";
      const token2 = "TOKEN_2";

      registry.register(token1, { useValue: "value1" });
      registry.register(token2, { useValue: "value2" });

      const providers = registry.getAllProviders();

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
      const token1 = "TOKEN_1";
      const token2 = Symbol("TOKEN_2");

      registry.register(token1, { useValue: "value1" });
      registry.register(token2, { useValue: "value2" });

      const tokens = registry.getAllTokens();

      expect(tokens).toHaveLength(2);
      expect(tokens).toContain(token1);
      expect(tokens).toContain(token2);
    });

    it("should return empty arrays when no providers are registered", () => {
      expect(registry.getAllProviders()).toEqual([]);
      expect(registry.getAllTokens()).toEqual([]);
    });
  });

  describe("Symbol tokens", () => {
    it("should work with Symbol tokens", () => {
      const token = Symbol("SYMBOL_TOKEN");

      registry.register(token, { useValue: "symbol-value" });

      expect(registry.has(token)).toBe(true);
      expect(registry.getProvider(token)).toEqual({ useValue: "symbol-value" });
    });
  });

  describe("Class tokens", () => {
    it("should work with class tokens", () => {
      class TokenClass {}

      registry.register(TokenClass, { useValue: "class-value" });

      expect(registry.has(TokenClass)).toBe(true);
      expect(registry.getProvider(TokenClass)).toEqual({
        useValue: "class-value",
      });
    });
  });

  describe("Complex configurations", () => {
    it("should handle complex provider configurations", () => {
      const token = "COMPLEX_TOKEN";
      class TestService {}
      const dependencies = ["DEP1", "DEP2"];

      registry.register(token, {
        useClass: TestService,
        lifecycle: "singleton",
        ttl: 60000,
        dependencies,
      });

      expect(registry.getProvider(token)).toEqual({
        useClass: TestService,
        lifecycle: "singleton",
        ttl: 60000,
        dependencies,
      });
    });
  });
});
