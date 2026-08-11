import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLazyInject, useInjectLazy } from "../use-lazy-inject";
import { useInject } from "../use-inject";
import { DependencyError } from "../../../core/dependency-error";
import { Container } from "../../../core/container";

vi.mock("../use-inject", () => ({
  useInject: vi.fn(),
}));

const mockContainer = {
  resolve: vi.fn(),
} as unknown as Container;

vi.mock("../../context", () => ({
  useDIContainer: () => mockContainer,
}));

interface MockService {
  method: () => string;
  asyncMethod: () => Promise<string>;
  property: string;
}

describe("useLazyInject", () => {
  const mockToken = "TEST_SERVICE";
  const mockService: MockService = {
    method: vi.fn().mockReturnValue("test result"),
    asyncMethod: vi.fn().mockResolvedValue("async result"),
    property: "test property",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useInject).mockReturnValue(mockService);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it("should return undefined instance and load function initially", () => {
    const { result } = renderHook(() => useLazyInject<MockService>(mockToken));

    expect(result.current[0]).toBeUndefined();
    expect(typeof result.current[1]).toBe("function");
    expect(useInject).toHaveBeenCalledWith(mockToken, {
      cachePromises: false,
    });
  });

  it("should load the service when load function is called", () => {
    const { result } = renderHook(() => useLazyInject<MockService>(mockToken));

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(mockService);
  });

  it("should not reload the service if already loaded", () => {
    const { result } = renderHook(() => useLazyInject<MockService>(mockToken));

    act(() => {
      result.current[1]();
    });

    const firstInstance = result.current[0];

    const newMockService = {
      ...mockService,
      method: vi.fn().mockReturnValue("new result"),
    };
    vi.mocked(useInject).mockReturnValue(newMockService);

    act(() => {
      result.current[1]();
    });

    expect(result.current[0]).toBe(firstInstance);
    expect(result.current[0]).not.toBe(newMockService);
  });

  it("should pass options to useInject", () => {
    const options = { scope: {}, cachePromises: true };

    renderHook(() => useLazyInject<MockService>(mockToken, options));

    expect(useInject).toHaveBeenCalledWith(mockToken, {
      ...options,
      cachePromises: false,
    });
  });

  it("should maintain the same load function between renders", () => {
    const { result, rerender } = renderHook(() =>
      useLazyInject<MockService>(mockToken),
    );
    const initialLoadFunction = result.current[1];

    rerender();

    expect(result.current[1]).toBe(initialLoadFunction);
  });

  it("should not update the instance when service reference changes after loading", () => {
    const { result, rerender } = renderHook(() =>
      useLazyInject<MockService>(mockToken),
    );

    act(() => {
      result.current[1]();
    });

    const originalInstance = result.current[0];

    const newMockService = {
      method: vi.fn().mockReturnValue("new result"),
      asyncMethod: vi.fn().mockResolvedValue("new async result"),
      property: "new",
    };
    vi.mocked(useInject).mockReturnValue(newMockService);

    rerender();

    expect(result.current[0]).toBe(originalInstance);
    expect(result.current[0]).not.toBe(newMockService);
  });
});

describe("useInjectLazy", () => {
  const mockToken = "TEST_SERVICE";
  const mockService: MockService = {
    method: vi.fn().mockReturnValue("test result"),
    asyncMethod: vi.fn().mockResolvedValue("async result"),
    property: "test property",
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(mockContainer.resolve).mockReturnValue(mockService);
  });

  it("should throw error when token is not provided", () => {
    expect(() => {
      // @ts-ignore
      renderHook(() => useInjectLazy(undefined));
    }).toThrow(DependencyError);

    expect(() => {
      // @ts-ignore
      renderHook(() => useInjectLazy(null));
    }).toThrow(DependencyError);
  });

  it("should return a proxy object that lazily resolves the service", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(mockContainer.resolve).not.toHaveBeenCalled();
    result.current.method();
    expect(mockContainer.resolve).toHaveBeenCalledWith(mockToken);
    expect(mockService.method).toHaveBeenCalled();
  });

  it("should only resolve the service once even when accessing multiple properties", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    result.current.method();
    result.current.asyncMethod();
    expect(result.current.property).toBe("test property");
    expect(mockContainer.resolve).toHaveBeenCalledTimes(1);
  });

  it("should throw a DependencyError when accessing a non-existent property", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      // @ts-ignore
      result.current.nonExistentMethod();
    }).toThrow(DependencyError);
  });

  it("should throw when resolve returns a non-object value", () => {
    vi.mocked(mockContainer.resolve).mockReturnValue("not an object" as never);

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => result.current.method()).toThrow(DependencyError);
  });

  it("should wrap resolve errors", () => {
    vi.mocked(mockContainer.resolve).mockImplementation(() => {
      throw new Error("Service not found");
    });

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => result.current.method()).toThrow(
      /Failed to resolve lazy service: Service not found/,
    );
  });

  it("should cache resolved instance after first access", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));
    result.current.method();
    result.current.method();
    expect(mockContainer.resolve).toHaveBeenCalledTimes(1);
    expect(mockService.method).toHaveBeenCalledTimes(2);
  });
});

describe("lazy function (internal)", () => {
  const mockToken = Symbol("MOCK_TOKEN");
  const mockService = {
    method: vi.fn().mockReturnValue("test result"),
    asyncMethod: vi.fn().mockResolvedValue("async result"),
    property: "test property",
  };

  it("should cache the instance after first access", () => {
    let callCount = 0;
    vi.mocked(mockContainer.resolve).mockImplementation(() => {
      callCount++;
      return mockService;
    });

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));
    result.current.method();
    expect(callCount).toBe(1);
    result.current.method();
    expect(callCount).toBe(1);
  });
});
