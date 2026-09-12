import { Container, createToken, DependencyError } from "@brushy/di-core";
import { renderHook } from "@testing-library/react";
import React from "react";
import { afterEach, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { useInject } from "../use-inject";

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
  const actual = await vi.importActual<typeof import("@brushy/di-core")>("@brushy/di-core");
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

type IsAny<T> = 0 extends 1 & T ? true : false;

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

  it("should infer the registered service type without a generic", () => {
    const container = new Container();
    const SERVICE = container.register(createToken("TEST_SERVICE"), {
      useValue: mockService,
    });

    const { result } = renderHook(() => useInject(SERVICE));
    type InjectedService = typeof result.current;

    expectTypeOf<InjectedService>().toEqualTypeOf<MockService>();
    expectTypeOf<IsAny<InjectedService>>().toEqualTypeOf<false>();
    expect(mockContainer.resolve).toHaveBeenCalledWith(SERVICE);
    expect(result.current.regularMethod()).toBe("regular result");
  });

  it("should cache promise methods by default", () => {
    const cachedPromise = Promise.resolve("cached");
    mockGetCached.mockReturnValue(cachedPromise);

    const { result } = renderHook(() => useInject<MockService>(mockToken));
    expect(result.current.promiseMethod()).toBe(cachedPromise);
  });

  it("should infer a function provider without a generic", () => {
    const container = new Container();
    const formatLabel = (label: string) => `formatted:${label}`;
    const FORMAT = container.register(createToken("FORMAT"), {
      useValue: formatLabel,
    });

    vi.mocked(mockContainer.resolve).mockReturnValue(formatLabel);

    const { result } = renderHook(() => useInject(FORMAT));
    type Formatter = typeof result.current;

    expectTypeOf<Formatter>().toEqualTypeOf<(label: string) => string>();
    expectTypeOf<IsAny<Formatter>>().toEqualTypeOf<false>();
    expect(mockContainer.resolve).toHaveBeenCalledWith(FORMAT);
    expect(result.current("hello")).toBe("formatted:hello");
  });

  it("should infer a hook-like factory without a generic", () => {
    const container = new Container();
    type CounterState = { count: number; increment: () => void };

    const useCounter = (): CounterState => ({
      count: 0,
      increment: vi.fn(),
    });

    const USE_COUNTER = container.register(createToken("USE_COUNTER"), {
      useValue: useCounter,
    });

    vi.mocked(mockContainer.resolve).mockReturnValue(useCounter);

    const { result } = renderHook(() => {
      const hook = useInject(USE_COUNTER);
      return hook();
    });

    function injectHook(token: typeof USE_COUNTER) {
      return useInject(token);
    }

    expectTypeOf(injectHook).returns.toEqualTypeOf<typeof useCounter>();
    expectTypeOf<ReturnType<typeof injectHook>>().toEqualTypeOf<typeof useCounter>();
    expectTypeOf<IsAny<ReturnType<typeof injectHook>>>().toEqualTypeOf<false>();
    expect(result.current.count).toBe(0);
    expect(typeof result.current.increment).toBe("function");
  });

  it("should infer a class instance provider without a generic", () => {
    const container = new Container();
    class UserRepository {
      findById(id: string) {
        return `user:${id}`;
      }
    }

    const repository = new UserRepository();
    const USER_REPOSITORY = container.register(createToken("USER_REPOSITORY"), {
      useValue: repository,
    });

    vi.mocked(mockContainer.resolve).mockReturnValue(repository);

    const { result } = renderHook(() => useInject(USER_REPOSITORY));
    type Repository = typeof result.current;

    expectTypeOf<Repository>().toEqualTypeOf<UserRepository>();
    expectTypeOf<IsAny<Repository>>().toEqualTypeOf<false>();
    expect(result.current.findById("42")).toBe("user:42");
  });

  it("should return primitive providers without wrapping in a proxy", () => {
    const container = new Container();
    const API_URL = container.register(createToken("API_URL"), {
      useValue: "https://api.example.com",
    });

    vi.mocked(mockContainer.resolve).mockReturnValue("https://api.example.com");

    const { result } = renderHook(() => useInject(API_URL));
    type ApiUrl = typeof result.current;

    expectTypeOf<ApiUrl>().toEqualTypeOf<string>();
    expectTypeOf<IsAny<ApiUrl>>().toEqualTypeOf<false>();
    expect(result.current).toBe("https://api.example.com");
  });

  it("should resolve regular methods without storing their return value", () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    expect(result.current.regularMethod("arg")).toBe("regular result");
    expect(mockSetCached).not.toHaveBeenCalled();
    expect(mockService.regularMethod).toHaveBeenCalledWith("arg");
  });

  it("should store async method promises in the cache on first call", async () => {
    const { result } = renderHook(() => useInject<MockService>(mockToken));

    const first = result.current.asyncMethod();
    await expect(first).resolves.toBe("async result");
    expect(mockCreateCacheKey).toHaveBeenCalled();
    expect(mockSetCached).toHaveBeenCalledWith("test-cache-key", first);
  });

  it("should skip promise caching when cachePromises is false", () => {
    const cachedPromise = Promise.resolve("cached");
    mockGetCached.mockReturnValue(cachedPromise);

    const { result } = renderHook(() =>
      useInject<MockService>(mockToken, { cachePromises: false }),
    );

    const returned = result.current.promiseMethod();
    expect(returned).not.toBe(cachedPromise);
    expect(mockGetCached).not.toHaveBeenCalled();
    expect(returned).toBeInstanceOf(Promise);
  });

  it("should keep the same injected reference between rerenders", () => {
    const { result, rerender } = renderHook(() => useInject<MockService>(mockToken));
    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(mockContainer.resolve).toHaveBeenCalledTimes(1);
  });

  it("should inject multiple registered providers in the same hook", () => {
    const container = new Container();
    const API_URL = container.register(createToken("API_URL"), {
      useValue: "https://api.example.com",
    });
    const API_TIMEOUT = container.register(createToken("API_TIMEOUT"), {
      useValue: 5_000,
    });

    vi.mocked(mockContainer.resolve).mockImplementation((token) => {
      if (token === API_URL) return "https://api.example.com";
      if (token === API_TIMEOUT) return 5_000;
      return mockService;
    });

    const { result } = renderHook(() => ({
      apiUrl: useInject(API_URL),
      timeout: useInject(API_TIMEOUT),
      service: useInject<MockService>(mockToken),
    }));

    expect(result.current.apiUrl).toBe("https://api.example.com");
    expect(result.current.timeout).toBe(5_000);
    expect(result.current.service.regularMethod()).toBe("regular result");
  });

  it("should infer a config object provider without a generic", () => {
    const container = new Container();
    type AppConfig = {
      theme: "light" | "dark";
      getApiUrl: () => string;
    };

    const config: AppConfig = {
      theme: "dark",
      getApiUrl: () => "https://api.example.com",
    };

    const APP_CONFIG = container.register(createToken("APP_CONFIG"), {
      useValue: config,
    });

    vi.mocked(mockContainer.resolve).mockReturnValue(config);

    const { result } = renderHook(() => useInject(APP_CONFIG));
    type InjectedConfig = typeof result.current;

    expectTypeOf<InjectedConfig>().toEqualTypeOf<AppConfig>();
    expectTypeOf<IsAny<InjectedConfig>>().toEqualTypeOf<false>();
    expect(result.current.theme).toBe("dark");
    expect(result.current.getApiUrl()).toBe("https://api.example.com");
  });

  it("should keep the same proxy under React Strict Mode double mount", () => {
    const { result, rerender } = renderHook(() => useInject<MockService>(mockToken), {
      wrapper: ({ children }) => <React.StrictMode>{children}</React.StrictMode>,
    });

    const first = result.current;

    rerender();

    expect(result.current).toBe(first);
    expect(mockContainer.resolve).toHaveBeenCalledTimes(1);
  });
});
