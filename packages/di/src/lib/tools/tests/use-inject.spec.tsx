import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInject } from "../use-inject";
import { Container } from "../../../core/container";
import { DependencyError } from "../../../core/dependency-error";

const mockGetContainer = vi.fn();
const mockCreateCacheKey = vi.fn();
const mockGetCached = vi.fn();
const mockSetCached = vi.fn();

vi.mock("../../context", () => ({
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

vi.mock("../..", () => ({
  promiseCache: {
    createKey: (...args: unknown[]) => mockCreateCacheKey(...args),
    get: (key: string) => mockGetCached(key),
    set: (...args: unknown[]) => mockSetCached(...args),
  },
}));

interface MockService {
  regularMethod: (...args: unknown[]) => string;
  promiseMethod: (...args: unknown[]) => Promise<string>;
  asyncMethod: (...args: unknown[]) => Promise<string>;
  contextMethod?: (...args: unknown[]) => string;
  someProperty?: string;
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

  it("should throw an error when no container is found", () => {
    mockGetContainer.mockImplementation(() => {
      throw new DependencyError("Container not found");
    });

    expect(() => renderHook(() => useInject(mockToken))).toThrow(DependencyError);
  });

  it("should correctly format the error message when the error is an instance of Error", () => {
    mockGetContainer.mockImplementation(() => {
      throw new Error("Container not found");
    });

    try {
      renderHook(() => useInject(mockToken));
      expect.unreachable("Expected hook to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(DependencyError);
      expect((error as Error).message).toContain("BrushyDIProvider");
    }
  });

  it("should resolve the service from the container", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    expect(mockContainer.resolve).toHaveBeenCalledWith(mockToken);
    expect(result.current).toBeDefined();
  });

  it("should return primitive values directly without proxy", () => {
    vi.mocked(mockContainer.resolve).mockReturnValue("primitive-value");

    const { result } = renderHook(() => useInject<string>(mockToken));

    expect(result.current).toBe("primitive-value");
  });

  it("should cache promise methods by default", () => {
    const cachedPromise = Promise.resolve("cached");
    mockGetCached.mockReturnValue(cachedPromise);

    const { result } = renderHook(() => useInject<MockService>(mockToken));
    const returned = result.current.promiseMethod();

    expect(returned).toBe(cachedPromise);
    expect(mockService.promiseMethod).not.toHaveBeenCalled();
  });

  it("should not cache when cachePromises is false", () => {
    const { result } = renderHook(() =>
      useInject<MockService>(mockToken, { cachePromises: false }),
    );

    result.current.promiseMethod();
    expect(mockService.promiseMethod).toHaveBeenCalled();
  });

  it("should call regular methods without caching", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const value = result.current.regularMethod("arg");
    expect(value).toBe("regular result");
    expect(mockService.regularMethod).toHaveBeenCalledWith("arg");
  });

  it("should store new promises in cache", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    result.current.asyncMethod();
    expect(mockSetCached).toHaveBeenCalled();
  });
});
