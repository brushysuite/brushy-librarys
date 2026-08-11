import { describe, it, expect } from "vitest";
import { containerRegistry, promiseCacheSystem, PromiseCacheSystem } from "../index";
import { ContainerRegistry } from "../../core/container-registry";
import { PromiseCache } from "../../core/promise-cache";

describe("lib/index", () => {
  it("should export an instance of ContainerRegistry", () => {
    expect(containerRegistry).toBeInstanceOf(ContainerRegistry);
  });

  it("should export promise cache instances", () => {
    expect(promiseCacheSystem).toBeInstanceOf(PromiseCache);
    expect(new PromiseCacheSystem()).toBeInstanceOf(PromiseCache);
  });
});
