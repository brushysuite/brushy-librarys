import { describe, it, expect } from "vitest";
import { containerRegistry, promiseCacheSystem } from "../index";
import { ContainerRegistry } from "../../core/container-registry";
import { PromiseCacheSystem } from "../../core/promise-cache-system";

describe("lib/index", () => {
  describe("containerRegistry", () => {
    it("should export an instance of ContainerRegistry", () => {
      // Assert
      expect(containerRegistry).toBeInstanceOf(ContainerRegistry);
    });
  });

  describe("promiseCacheSystem", () => {
    it("should export an instance of PromiseCacheSystem", () => {
      // Assert
      expect(promiseCacheSystem).toBeInstanceOf(PromiseCacheSystem);
    });
  });
});
