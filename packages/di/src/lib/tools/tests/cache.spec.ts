import { describe, it, expect, vi, beforeEach } from "vitest";
import { cache } from "../cache";
import { promiseCacheSystem } from "../..";

vi.mock("../..", () => ({
  promiseCacheSystem: {
    clear: vi.fn(),
  },
}));

describe("cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("clear", () => {
    it("should clear the cache for a specific token", () => {
      const token = "TestService";

      cache.clear(token);

      expect(promiseCacheSystem.clear).toHaveBeenCalledWith(token);
    });

    it("should clear the entire cache when no token is provided", () => {
      cache.clear();

      expect(promiseCacheSystem.clear).toHaveBeenCalledWith(undefined);
    });
  });
});
