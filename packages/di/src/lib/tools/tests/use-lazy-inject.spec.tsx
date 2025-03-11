import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLazyInject } from "../use-lazy-inject";
import { useInject } from "../use-inject";
import React from "react";

vi.mock("../use-inject", () => ({
  useInject: vi.fn(),
}));

interface MockService {
  method: () => string;
  asyncMethod: () => Promise<string>;
}

describe("useLazyInject", () => {
  const mockToken = "TEST_SERVICE";
  const mockService: MockService = {
    method: vi.fn().mockReturnValue("test result"),
    asyncMethod: vi.fn().mockResolvedValue("async result"),
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
