import { describe, it, expect, vi, beforeEach } from "vitest";
import { cache } from "../cache";

vi.mock("../..", async () => {
  const actual = await vi.importActual<typeof import("../..")>("../..");
  return {
    ...actual,
    promiseCache: {
      clear: vi.fn(),
      createKey: vi.fn(),
      get: vi.fn(),
      set: vi.fn(),
    },
    promiseCacheSystem: {
      clear: vi.fn(),
    },
  };
});

import { promiseCacheSystem } from "../..";

describe("cache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cache._cache.clear();
  });

  describe("clear", () => {
    it("should clear the cache for a specific token", () => {
      cache.clear("TestService");
      expect(promiseCacheSystem.clear).toHaveBeenCalledWith("TestService");
    });

    it("should clear the entire cache when no token is provided", () => {
      cache.clear();
      expect(promiseCacheSystem.clear).toHaveBeenCalledWith(undefined);
    });
  });
});
