import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useStorage } from "../use-storage";
import { LocalStorage } from "../../lib/localstorage";

vi.mock("../../lib/localstorage", () => ({
  LocalStorage: vi.fn(() => ({
    get: vi.fn(),
    set: vi.fn(),
    remove: vi.fn(),
  })),
}));

describe("useStorage", () => {
  const key = "testKey";
  const initialValue = { name: "John", age: 30 };
  const options = { compress: true };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with stored value", () => {
    const storedValue = { name: "Jane", age: 25 };
    const mockGet = vi.fn().mockReturnValue(storedValue);

    (LocalStorage as any).mockImplementation(() => ({
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, options));

    expect(result.current.value).toEqual(storedValue);
    expect(mockGet).toHaveBeenCalledWith(key);
  });

  it("should initialize with initial value if no stored value", () => {
    const mockGet = vi.fn().mockReturnValue(null);

    (LocalStorage as any).mockImplementation(() => ({
      get: mockGet,
      set: vi.fn(),
      remove: vi.fn(),
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, options));

    expect(result.current.value).toEqual(initialValue);
    expect(mockGet).toHaveBeenCalledWith(key);
  });

  it("should update value correctly", () => {
    const mockSet = vi.fn();
    const newValue = { name: "Jane", age: 25 };

    (LocalStorage as any).mockImplementation(() => ({
      get: vi.fn(),
      set: mockSet,
      remove: vi.fn(),
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, options));

    act(() => {
      result.current.setValue(newValue);
    });

    expect(result.current.value).toEqual(newValue);
    expect(mockSet).toHaveBeenCalledWith(key, newValue, {
      ...options,
      compress: true,
    });
  });

  it("should update value using a function", () => {
    const mockSet = vi.fn();

    (LocalStorage as any).mockImplementation(() => ({
      get: vi.fn().mockReturnValue(initialValue),
      set: mockSet,
      remove: vi.fn(),
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, options));

    act(() => {
      result.current.setValue((prev) => ({ ...prev, age: prev.age + 1 }));
    });

    expect(result.current.value).toEqual({ ...initialValue, age: 31 });
    expect(mockSet).toHaveBeenCalledWith(
      key,
      { ...initialValue, age: 31 },
      {
        ...options,
        compress: true,
      },
    );
  });

  it("should update fields correctly", () => {
    const mockSet = vi.fn();
    const updates = { name: "Jane" };

    (LocalStorage as any).mockImplementation(() => ({
      get: vi.fn().mockReturnValue(initialValue),
      set: mockSet,
      remove: vi.fn(),
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, options));

    act(() => {
      result.current.updateFields(updates);
    });

    expect(result.current.value).toEqual({ ...initialValue, ...updates });
    expect(mockSet).toHaveBeenCalledWith(
      key,
      { ...initialValue, ...updates },
      {
        ...options,
        compress: true,
      },
    );
  });

  it("should remove item correctly", () => {
    const mockRemove = vi.fn();

    (LocalStorage as any).mockImplementation(() => ({
      get: vi.fn(),
      set: vi.fn(),
      remove: mockRemove,
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, options));

    act(() => {
      result.current.remove();
    });

    expect(result.current.value).toEqual(initialValue);
    expect(mockRemove).toHaveBeenCalledWith(key);
  });

  it("should handle auto compression based on value size", () => {
    const mockSet = vi.fn();
    const largeValue = {
      name: "John",
      description: "A".repeat(2000),
    };

    (LocalStorage as any).mockImplementation(() => ({
      get: vi.fn(),
      set: mockSet,
      remove: vi.fn(),
    }));

    const { result } = renderHook(() => useStorage(key, initialValue, {}));

    act(() => {
      result.current.setValue(largeValue as any);
    });

    expect(result.current.value).toEqual(largeValue);
    expect(mockSet).toHaveBeenCalledWith(key, largeValue, {
      compress: true,
    });
  });
});
