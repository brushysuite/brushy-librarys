import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInject } from "../use-inject";
import { containerRegistry, promiseCacheSystem } from "../..";
import { Container } from "../../../core/container";
import { DependencyError } from "../../../core/dependency-error";

vi.mock("../..", () => ({
  containerRegistry: {
    getContainer: vi.fn(),
  },
  promiseCacheSystem: {
    createCacheKey: vi.fn(),
    getCachedPromise: vi.fn(),
    isCacheValid: vi.fn(),
    setCachedPromise: vi.fn(),
  },
}));

interface MockService {
  regularMethod: (...args: any[]) => string;
  promiseMethod: (...args: any[]) => Promise<string>;
  asyncMethod: (...args: any[]) => Promise<string>;
  contextMethod?: (...args: any[]) => string;
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

    vi.mocked(containerRegistry.getContainer).mockReturnValue(mockContainer);

    mockService = {
      regularMethod: vi.fn().mockReturnValue("regular result"),
      promiseMethod: vi.fn().mockReturnValue(Promise.resolve("promise result")),
      asyncMethod: vi.fn().mockImplementation(async () => "async result"),
    };

    vi.mocked(mockContainer.resolve).mockReturnValue(mockService);

    vi.mocked(promiseCacheSystem.createCacheKey).mockReturnValue(
      "test-cache-key",
    );
    vi.mocked(promiseCacheSystem.getCachedPromise).mockReturnValue(undefined);
    vi.mocked(promiseCacheSystem.isCacheValid).mockReturnValue(false);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should throw an error when no container is found", () => {
    vi.mocked(containerRegistry.getContainer).mockImplementation(() => {
      throw new Error("Container not found");
    });

    expect(() => {
      renderHook(() => useInject(mockToken));
    }).toThrow(DependencyError);
  });

  it("should correctly format the error message when the error is an instance of Error", () => {
    const errorMessage = "Container not found";
    vi.mocked(containerRegistry.getContainer).mockImplementation(() => {
      throw new Error(errorMessage);
    });

    let capturedError: unknown;
    try {
      renderHook(() => useInject(mockToken));

      expect(true).toBe(false);
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(DependencyError);
    expect((capturedError as DependencyError).message).toContain(errorMessage);
  });

  it("should correctly format the error message when the error is not an instance of Error", () => {
    const errorObj = { code: 404, message: "Not Found" };
    vi.mocked(containerRegistry.getContainer).mockImplementation(() => {
      throw errorObj;
    });

    let capturedError: unknown;
    try {
      renderHook(() => useInject(mockToken));

      expect(true).toBe(false);
    } catch (error) {
      capturedError = error;
    }

    expect(capturedError).toBeInstanceOf(DependencyError);
    expect((capturedError as DependencyError).message).toContain(
      String(errorObj),
    );
  });

  it("should resolve and return a primitive service directly", () => {
    const primitiveValue = "string value";
    vi.mocked(mockContainer.resolve).mockReturnValue(primitiveValue);

    const { result } = renderHook(() => useInject<string>(mockToken));

    expect(result.current).toBe(primitiveValue);
    expect(containerRegistry.getContainer).toHaveBeenCalledWith(undefined);
    expect(mockContainer.resolve).toHaveBeenCalledWith(mockToken);
  });

  it("should resolve and return a null service directly", () => {
    const nullValue = null;
    vi.mocked(mockContainer.resolve).mockReturnValue(nullValue);

    const { result } = renderHook(() => useInject(mockToken));

    expect(result.current).toBeNull();
    expect(containerRegistry.getContainer).toHaveBeenCalledWith(undefined);
    expect(mockContainer.resolve).toHaveBeenCalledWith(mockToken);
  });

  it("should resolve and return an object service with a proxy", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    expect(result.current).toBeDefined();
    expect(typeof result.current).toBe("object");
    expect(containerRegistry.getContainer).toHaveBeenCalledWith(undefined);
    expect(mockContainer.resolve).toHaveBeenCalledWith(mockToken);
  });

  it("should call regular methods through the proxy", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const returnValue = result.current.regularMethod();

    expect(returnValue).toBe("regular result");
    expect(mockService.regularMethod).toHaveBeenCalled();
    expect(promiseCacheSystem.setCachedPromise).not.toHaveBeenCalled();
  });

  it("should access non-function properties directly", () => {
    mockService.someProperty = "property value";
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    expect(result.current.someProperty).toBe("property value");
  });

  it("should cache promises returned by methods when cachePromises=true (default)", async () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const promise = result.current.promiseMethod();

    expect(promiseCacheSystem.createCacheKey).toHaveBeenCalledWith(
      String(mockToken),
      "promiseMethod",
      [],
    );
    expect(promiseCacheSystem.setCachedPromise).toHaveBeenCalledWith(
      "test-cache-key",
      promise,
    );

    const value = await promise;
    expect(value).toBe("promise result");
  });

  it("should cache promises returned by async methods when cachePromises=true (default)", async () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const promise = result.current.asyncMethod();

    expect(promiseCacheSystem.createCacheKey).toHaveBeenCalledWith(
      String(mockToken),
      "asyncMethod",
      [],
    );
    expect(promiseCacheSystem.setCachedPromise).toHaveBeenCalledWith(
      "test-cache-key",
      promise,
    );

    const value = await promise;
    expect(value).toBe("async result");
  });

  it("should not cache promises when cachePromises=false", async () => {
    const { result } = renderHook(() =>
      useInject<MockService>(mockToken, { cachePromises: false }),
    );

    await result.current.promiseMethod();

    expect(promiseCacheSystem.setCachedPromise).not.toHaveBeenCalled();
  });

  it("should return cached promise when available and valid", async () => {
    const cachedPromise = Promise.resolve("cached result");
    vi.mocked(promiseCacheSystem.getCachedPromise).mockReturnValue(
      cachedPromise,
    );
    vi.mocked(promiseCacheSystem.isCacheValid).mockReturnValue(true);

    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const returnedPromise = result.current.promiseMethod();

    expect(returnedPromise).toBe(cachedPromise);
    expect(mockService.promiseMethod).not.toHaveBeenCalled();
  });

  it("should use the provided scope to get the container", () => {
    const mockScope = {};

    renderHook(() => useInject<MockService>(mockToken, { scope: mockScope }));

    expect(containerRegistry.getContainer).toHaveBeenCalledWith(mockScope);
  });

  it("should maintain the same proxy instance between re-renders", () => {
    const { result, rerender } = renderHook(() =>
      useInject<MockService>(mockToken),
    );
    const firstInstance = result.current;

    rerender();
    const secondInstance = result.current;

    expect(secondInstance).toBe(firstInstance);
  });

  it("should pass arguments correctly to methods", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    result.current.regularMethod("arg1", 123, { key: "value" });

    expect(mockService.regularMethod).toHaveBeenCalledWith("arg1", 123, {
      key: "value",
    });
  });

  it("should create cache key with arguments", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));
    const args = ["arg1", 123, { key: "value" }];

    result.current.promiseMethod(...args);

    expect(promiseCacheSystem.createCacheKey).toHaveBeenCalledWith(
      String(mockToken),
      "promiseMethod",
      args,
    );
  });

  it("should preserve the this context when calling methods", () => {
    mockService.contextMethod = vi.fn(function (this: any) {
      return this.regularMethod();
    });

    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const returnValue = result.current.contextMethod?.();

    expect(mockService.contextMethod).toHaveBeenCalled();
    expect(mockService.regularMethod).toHaveBeenCalled();
    expect(returnValue).toBe("regular result");
  });
});
