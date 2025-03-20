import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLazyInject, useInjectLazy } from "../use-lazy-inject";
import { useInject } from "../use-inject";
import { DependencyError } from "../../../core/dependency-error";

vi.mock("../use-inject", () => ({
  useInject: vi.fn(),
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
    vi.mocked(useInject).mockReturnValue(mockService);
  });

  afterEach(() => {
    vi.resetAllMocks();
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

    expect(useInject).not.toHaveBeenCalled();

    result.current.method();

    expect(useInject).toHaveBeenCalledWith(mockToken, {
      cachePromises: false,
    });

    expect(mockService.method).toHaveBeenCalled();
  });

  it("should only resolve the service once even when accessing multiple properties", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    result.current.method();
    expect(useInject).toHaveBeenCalledTimes(1);

    result.current.asyncMethod();
    expect(useInject).toHaveBeenCalledTimes(1);

    const prop = result.current.property;
    expect(prop).toBe("test property");
    expect(useInject).toHaveBeenCalledTimes(1);
  });

  it("should pass options to useInject", () => {
    const options = { scope: {}, cachePromises: true };
    const { result } = renderHook(() =>
      useInjectLazy<MockService>(mockToken, options),
    );

    result.current.method();

    expect(useInject).toHaveBeenCalledWith(mockToken, {
      ...options,
      cachePromises: false,
    });
  });

  it("should throw a DependencyError when accessing a non-existent property", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      // @ts-ignore
      result.current.nonExistentMethod();
    }).toThrow(DependencyError);
  });

  it("should throw a DependencyError when useInject returns a non-object value", () => {
    vi.mocked(useInject).mockReturnValue("not an object" as any);

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
  });

  it("should throw a DependencyError when useInject throws an error", () => {
    vi.mocked(useInject).mockImplementation(() => {
      throw new Error("Service not found");
    });

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Failed to resolve lazy service: Service not found/);
  });

  it("should store the resolved instance internally", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));
    result.current.method();
    result.current.method();
    result.current.asyncMethod();
    expect(useInject).toHaveBeenCalledTimes(1);
    expect(mockService.method).toHaveBeenCalledTimes(2);
  });

  it("should throw a DependencyError when useInject returns null", () => {
    vi.mocked(useInject).mockReturnValue(null as any);

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Invalid service instance/);
  });

  it("should throw a DependencyError when useInject returns undefined", () => {
    vi.mocked(useInject).mockReturnValue(undefined as any);

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Invalid service instance/);
  });

  it("should handle non-Error exceptions from useInject", () => {
    vi.mocked(useInject).mockImplementation(() => {
      throw "String error message";
    });

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Failed to resolve lazy service: String error message/);
  });

  it("should handle symbol properties", () => {
    const symbolProp = Symbol("testSymbol");
    const mockServiceWithSymbol = {
      ...mockService,
      [symbolProp]: "symbol value",
    };

    vi.mocked(useInject).mockReturnValue(mockServiceWithSymbol as any);

    const { result } = renderHook(() =>
      useInjectLazy<typeof mockServiceWithSymbol>(mockToken),
    );

    result.current.method();

    expect(result.current[symbolProp]).toBe("symbol value");
    expect(useInject).toHaveBeenCalledTimes(1);
  });

  it("should handle empty options", () => {
    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    result.current.method();

    expect(useInject).toHaveBeenCalledWith(mockToken, {
      cachePromises: false,
    });
  });

  it("should handle various token types", () => {
    const stringToken = "STRING_TOKEN";
    renderHook(() => useInjectLazy<MockService>(stringToken));

    const symbolToken = Symbol("SYMBOL_TOKEN");
    renderHook(() => useInjectLazy<MockService>(symbolToken));

    const objectToken = { id: "OBJECT_TOKEN" };
    //@ts-ignore
    renderHook(() => useInjectLazy<MockService>(objectToken));
    expect(useInject).toHaveBeenCalledTimes(0);
  });

  it("should handle multiple instances with different tokens", () => {
    const token1 = "TOKEN_1";
    const token2 = "TOKEN_2";

    const service1 = { ...mockService, id: "service1" };
    const service2 = { ...mockService, id: "service2" };

    vi.mocked(useInject).mockImplementation((token) => {
      if (token === token1) return service1 as any;
      if (token === token2) return service2 as any;
      return null as any;
    });

    const { result: result1 } = renderHook(() =>
      useInjectLazy<typeof service1>(token1),
    );
    const { result: result2 } = renderHook(() =>
      useInjectLazy<typeof service2>(token2),
    );

    result1.current.method();
    result2.current.method();

    expect(result1.current.id).toBe("service1");
    expect(result2.current.id).toBe("service2");
  });

  it("should handle primitive values returned by useInject", () => {
    vi.mocked(useInject).mockReturnValue(42 as any);

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Failed to resolve lazy service: Cannot use 'in' operator to search for 'method' in 42/);

    vi.mocked(useInject).mockReturnValue(true as any);

    const { result: result2 } = renderHook(() =>
      useInjectLazy<MockService>(mockToken),
    );

    expect(() => {
      result2.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result2.current.method();
    }).toThrow(/Failed to resolve lazy service: Cannot use 'in' operator to search for 'method' in true/);
  });

  it("should handle complex error scenarios", () => {
    const problematicService = {
      get method() {
        throw new Error("Property access error");
      },
    };

    vi.mocked(useInject).mockReturnValue(problematicService as any);

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Failed to resolve lazy service: Property access error/);
  });

  it("should handle non-standard error objects", () => {
    const customError = { message: "Custom error object", isError: true };

    vi.mocked(useInject).mockImplementation(() => {
      throw customError;
    });

    const { result } = renderHook(() => useInjectLazy<MockService>(mockToken));

    expect(() => {
      result.current.method();
    }).toThrow(DependencyError);
    expect(() => {
      result.current.method();
    }).toThrow(/Failed to resolve lazy service: \[object Object\]/);
  });

  it("should handle proxy behavior with various property types", () => {
    const complexService = {
      ...mockService,
      nestedObject: { value: "nested" },
      get computedProp() {
        return "computed";
      },
      writableProp: undefined as string | undefined,
    };

    vi.mocked(useInject).mockReturnValue(complexService as any);

    const { result } = renderHook(() =>
      useInjectLazy<typeof complexService>(mockToken),
    );

    expect(result.current.nestedObject.value).toBe("nested");

    expect(result.current.computedProp).toBe("computed");

    expect(() => {
      (result.current as any).writableProp = "new value";
    }).not.toThrow();

    expect(useInject).toHaveBeenCalledTimes(1);
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
    vi.mocked(useInject).mockImplementation(() => {
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
