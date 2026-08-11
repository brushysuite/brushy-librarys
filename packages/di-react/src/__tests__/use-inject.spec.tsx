import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInject } from "../use-inject";
import { Container, DependencyError } from "@brushy/di-core";

const mockGetContainer = vi.fn();
const mockCreateCacheKey = vi.fn();
const mockGetCached = vi.fn();
const mockSetCached = vi.fn();

vi.mock("../context", () => ({
  useDIContainer: () => {
    try {
      return mockGetContainer();
    } catch (error) {
      throw new DependencyError(
        `Unable to find a container for injection. Make sure your application is wrapped by a BrushyDIProvider. Original error: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  },
}));

vi.mock("@brushy/di-core", async () => {
  const actual = await vi.importActual<typeof import("@brushy/di-core")>(
    "@brushy/di-core",
  );
  return {
    ...actual,
    promiseCache: {
      createKey: (...args: unknown[]) => mockCreateCacheKey(...args),
      get: (key: string) => mockGetCached(key),
      set: (...args: unknown[]) => mockSetCached(...args),
    },
  };
});

interface MockService {
  regularMethod: (...args: unknown[]) => string;
  promiseMethod: (...args: unknown[]) => Promise<string>;
  asyncMethod: (...args: unknown[]) => Promise<string>;
}

describe("useInject", () => {
  let mockContainer: Container;
  let mockService: MockService;
  const mockToken = "TEST_SERVICE";

  beforeEach(() => {
    vi.clearAllMocks();

    mockContainer = {
      resolve: vi.fn(),
    } as unknown as Container;

    mockGetContainer.mockReturnValue(mockContainer);

    mockService = {
      regularMethod: vi.fn().mockReturnValue("regular result"),
      promiseMethod: vi.fn().mockReturnValue(Promise.resolve("promise result")),
      asyncMethod: vi.fn().mockImplementation(async () => "async result"),
    };

    vi.mocked(mockContainer.resolve).mockReturnValue(mockService);
    mockCreateCacheKey.mockReturnValue("test-cache-key");
    mockGetCached.mockReturnValue(undefined);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw when no container is found", () => {
    mockGetContainer.mockImplementation(() => {
      throw new DependencyError("Container not found");
    });

    expect(() => renderHook(() => useInject(mockToken))).toThrow(DependencyError);
  });

  it("should resolve the service from the container", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));
    expect(mockContainer.resolve).toHaveBeenCalledWith(mockToken);
    expect(result.current).toBeDefined();
  });

  it("should cache promise methods by default", () => {
    const cachedPromise = Promise.resolve("cached");
    mockGetCached.mockReturnValue(cachedPromise);

    const { result } = renderHook(() => useInject<MockService>(mockToken));
    expect(result.current.promiseMethod()).toBe(cachedPromise);
  });
});
