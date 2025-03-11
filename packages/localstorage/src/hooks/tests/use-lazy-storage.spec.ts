import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useLazyStorage } from "../use-lazy-storage";
import { LazyStorage } from "../../lib/lazy-storage";

vi.mock("../../lib/lazy-storage", () => ({
  LazyStorage: vi.fn(() => ({
    getLazy: vi.fn(),
    setLazy: vi.fn(),
    preload: vi.fn(),
    remove: vi.fn(),
  })),
}));

vi.mock("../../../di/src/lib/tools/use-lazy-inject", () => ({
  useLazyInject: vi.fn(() => [undefined, vi.fn()]),
}));

describe("useLazyStorage", () => {
  const key = "testKey";
  const initialValue = { name: "John", age: 30 };
  const options = { compression: { mode: "auto" as const, threshold: 2048 } };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with stored value", () => {
    const storedValue = { name: "Jane", age: 25 };
    const mockGetLazy = vi.fn().mockReturnValue(storedValue);

    (LazyStorage as any).mockImplementation(() => ({
      getLazy: mockGetLazy,
      setLazy: vi.fn(),
      preload: vi.fn(),
      remove: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    expect(result.current.value).toEqual(storedValue);
    expect(mockGetLazy).toHaveBeenCalledWith(key, options);
  });

  it("should initialize with initial value if no stored value", () => {
    const mockGetLazy = vi.fn().mockReturnValue(null);

    (LazyStorage as any).mockImplementation(() => ({
      getLazy: mockGetLazy,
      setLazy: vi.fn(),
      preload: vi.fn(),
      remove: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    expect(result.current.value).toEqual(initialValue);
    expect(mockGetLazy).toHaveBeenCalledWith(key, options);
  });

  it("should update value correctly", () => {
    const mockSetLazy = vi.fn();
    const newValue = { name: "Jane", age: 25 };

    (LazyStorage as any).mockImplementation(() => ({
      getLazy: vi.fn(),
      setLazy: mockSetLazy,
      preload: vi.fn(),
      remove: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    act(() => {
      result.current.setValue(newValue);
    });

    expect(result.current.value).toEqual(newValue);
    expect(mockSetLazy).toHaveBeenCalledWith(key, newValue, {
      ...options,
      compression: { mode: "auto", threshold: 2048 },
    });
  });

  it("should update value using a function", () => {
    const mockSetLazy = vi.fn();

    (LazyStorage as any).mockImplementation(() => ({
      getLazy: vi.fn().mockReturnValue(initialValue),
      setLazy: mockSetLazy,
      preload: vi.fn(),
      remove: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    act(() => {
      result.current.setValue((prev) => ({ ...prev, age: prev.age + 1 }));
    });

    expect(result.current.value).toEqual({ ...initialValue, age: 31 });
    expect(mockSetLazy).toHaveBeenCalledWith(
      key,
      { ...initialValue, age: 31 },
      {
        ...options,
        compression: { mode: "auto", threshold: 2048 },
      },
    );
  });

  it("should preload field correctly", () => {
    const mockPreload = vi.fn();

    (LazyStorage as any).mockImplementation(() => ({
      getLazy: vi.fn(),
      setLazy: vi.fn(),
      preload: mockPreload,
      remove: vi.fn(),
    }));

    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    act(() => {
      result.current.preloadField("name");
    });

    expect(mockPreload).toHaveBeenCalledWith(key, ["name"]);
    expect(result.current.isFieldLoaded("name")).toBe(true);
  });

  it("should check if field is loaded correctly", () => {
    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    expect(result.current.isFieldLoaded("name")).toBe(false);

    act(() => {
      result.current.setValue({ ...initialValue, name: "Jane" });
    });

    expect(result.current.isFieldLoaded("name")).toBe(true);
  });

  it("should remove item correctly", () => {
    const mockRemove = vi.fn();

    (LazyStorage as any).mockImplementation(() => ({
      getLazy: vi.fn(),
      setLazy: vi.fn(),
      preload: vi.fn(),
      remove: mockRemove,
    }));

    const { result } = renderHook(() =>
      useLazyStorage(key, initialValue, options),
    );

    act(() => {
      result.current.remove();
    });

    expect(result.current.value).toEqual(initialValue);
    expect(mockRemove).toHaveBeenCalledWith(key);
    expect(result.current.isFieldLoaded("name")).toBe(false);
  });
});
