import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useJSONStorage } from "../use-json-storage";
import { JSONStorage } from "../../lib/json-storage";

const createMockStorage = (customMocks = {}) => {
  return {
    getJSON: vi.fn(),
    setJSON: vi.fn(),
    updateJSON: vi.fn(),
    mergeArrays: vi.fn(),
    remove: vi.fn(),
    isValidJSON: vi.fn().mockReturnValue(true),
    getJSONSchema: vi.fn().mockReturnValue({ type: "object" }),
    ...customMocks,
  };
};

vi.mock("../../lib/json-storage", () => ({
  JSONStorage: vi.fn(() => createMockStorage()),
}));

describe("useJSONStorage", () => {
  const key = "testKey";
  const initialValue = { name: "John", age: 30 };
  const options = { reviver: (key: string, value: any) => value };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize with stored value", () => {
    const storedValue = { name: "Jane", age: 25 };
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(storedValue),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.value).toEqual(storedValue);
    expect(mockStorage.getJSON).toHaveBeenCalledWith(key, {
      reviver: options.reviver,
    });
  });

  it("should initialize with initial value if no stored value", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(null),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.value).toEqual(initialValue);
    expect(mockStorage.getJSON).toHaveBeenCalledWith(key, {
      reviver: options.reviver,
    });
  });

  it("should update value correctly", () => {
    const mockStorage = createMockStorage();
    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );
    const newValue = { name: "Jane", age: 25 };

    act(() => {
      result.current.setValue(newValue);
    });

    expect(result.current.value).toEqual(newValue);
    expect(mockStorage.setJSON).toHaveBeenCalledWith(key, newValue, options);
  });

  it("should update fields correctly", () => {
    const updatedValue = { name: "Jane", age: 30 };
    const mockStorage = createMockStorage({
      updateJSON: vi.fn().mockReturnValue(updatedValue),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    act(() => {
      result.current.updateFields({ name: "Jane" });
    });

    expect(result.current.value).toEqual(updatedValue);
    expect(mockStorage.updateJSON).toHaveBeenCalledWith(
      key,
      { name: "Jane" },
      options,
    );
  });

  it("should merge arrays correctly", () => {
    const initialArray = ["a", "b"];
    const mergedArray = ["a", "b", "c", "d"];

    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(initialArray),
      mergeArrays: vi.fn().mockReturnValue(mergedArray),
      getJSONSchema: vi.fn().mockReturnValue({ type: "array" }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialArray, options),
    );

    act(() => {
      result.current.mergeArrays(["c", "d"]);
    });

    expect(result.current.value).toEqual(mergedArray);
    expect(mockStorage.mergeArrays).toHaveBeenCalledWith(key, ["c", "d"], {
      ...options,
    });
  });

  it("should merge arrays with unique option and comparator", () => {
    const initialArray = [
      { id: 1, value: "a" },
      { id: 2, value: "b" },
    ];
    const newItems = [
      { id: 2, value: "b" },
      { id: 3, value: "c" },
    ];
    const mergedArray = [
      { id: 1, value: "a" },
      { id: 2, value: "b" },
      { id: 3, value: "c" },
    ];

    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(initialArray),
      mergeArrays: vi.fn().mockReturnValue(mergedArray),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialArray, options),
    );

    const comparator = (a: any, b: any) => a.id === b.id;

    act(() => {
      result.current.mergeArrays(newItems, {
        unique: true,
        comparator,
      });
    });

    expect(mockStorage.mergeArrays).toHaveBeenCalledWith(key, newItems, {
      ...options,
      unique: true,
      comparator,
    });
  });

  it("should remove item correctly", () => {
    const mockStorage = createMockStorage();
    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    act(() => {
      result.current.remove();
    });

    expect(result.current.value).toEqual(initialValue);
    expect(mockStorage.remove).toHaveBeenCalledWith(key);
  });

  it("should handle error in updateFields", () => {
    const mockStorage = createMockStorage({
      updateJSON: vi.fn().mockImplementation(() => {
        throw new Error("Update error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(() => {
      act(() => {
        result.current.updateFields({ name: "Jane" });
      });
    }).toThrow("Update error");
  });

  it("should handle error in mergeArrays", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(["a", "b"]),
      mergeArrays: vi.fn().mockImplementation(() => {
        throw new Error("Merge error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, ["a", "b"], options),
    );

    expect(() => {
      act(() => {
        result.current.mergeArrays(["c", "d"]);
      });
    }).toThrow("Merge error");
  });

  it("should handle error in setValue", () => {
    const mockStorage = createMockStorage({
      setJSON: vi.fn().mockImplementation(() => {
        throw new Error("Set error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(() => {
      act(() => {
        result.current.setValue({ name: "Jane", age: 25 });
      });
    }).toThrow("Set error");
  });

  it("should handle error in getJSON", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockImplementation(() => {
        throw new Error("Get error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    expect(() => {
      renderHook(() => useJSONStorage(key, initialValue, options));
    }).toThrow("Get error");
  });

  it("should handle error in setJSON", () => {
    const mockStorage = createMockStorage({
      setJSON: vi.fn().mockImplementation(() => {
        throw new Error("Set error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(() => {
      act(() => {
        result.current.setValue({ name: "Jane", age: 25 });
      });
    }).toThrow("Set error");
  });

  it("should handle error in updateJSON", () => {
    const mockStorage = createMockStorage({
      updateJSON: vi.fn().mockImplementation(() => {
        throw new Error("Update error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(() => {
      act(() => {
        result.current.updateFields({ name: "Jane" });
      });
    }).toThrow("Update error");
  });

  it("should handle error in remove", () => {
    const mockStorage = createMockStorage({
      remove: vi.fn().mockImplementation(() => {
        throw new Error("Remove error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(() => {
      act(() => {
        result.current.remove();
      });
    }).toThrow("Remove error");
  });

  it("should initialize isValid state correctly", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(initialValue),
      isValidJSON: vi.fn().mockReturnValue(true),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.isValid).toBe(true);
    expect(mockStorage.getJSON).toHaveBeenCalled();
  });

  it("should initialize isValid state as false when JSON is invalid", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(null),
      isValidJSON: vi.fn().mockReturnValue(false),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.isValid).toBe(false);
    expect(mockStorage.getJSON).toHaveBeenCalled();
  });

  it("should initialize schema state correctly", () => {
    const expectedSchema = {
      type: "object",
      properties: { name: { type: "string" } },
    };
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(initialValue),
      getJSONSchema: vi.fn().mockReturnValue(expectedSchema),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.schema).toEqual(expectedSchema);
    expect(mockStorage.getJSON).toHaveBeenCalled();
    expect(mockStorage.getJSONSchema).toHaveBeenCalledWith(key);
  });

  it("should initialize schema as null when there is no stored value", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(null),
      getJSONSchema: vi.fn().mockReturnValue(null),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.schema).toBeNull();
    expect(mockStorage.getJSON).toHaveBeenCalled();
  });

  it("should update isValid and schema when setting a new value", () => {
    const newValue = { name: "Jane", age: 25 };
    const newSchema = {
      type: "object",
      properties: { name: { type: "string" }, age: { type: "number" } },
    };

    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(initialValue),
      setJSON: vi.fn(),
      isValidJSON: vi.fn().mockReturnValue(true),
      getJSONSchema: vi.fn().mockReturnValue(newSchema),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    act(() => {
      result.current.setValue(newValue);
    });

    expect(result.current.value).toEqual(newValue);
    expect(result.current.isValid).toBe(true);
    expect(result.current.schema).toEqual(newSchema);
    expect(mockStorage.setJSON).toHaveBeenCalledWith(key, newValue, options);
    expect(mockStorage.isValidJSON).toHaveBeenCalledWith(key);
    expect(mockStorage.getJSONSchema).toHaveBeenCalledWith(key);
  });

  it("should handle error in isValidJSON", () => {
    const mockStorage = createMockStorage({
      getJSON: vi.fn().mockReturnValue(null),
      isValidJSON: vi.fn().mockImplementation(() => {
        throw new Error("Validation error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.isValid).toBe(false);
  });

  it("should handle error in getJSONSchema", () => {
    const mockStorage = createMockStorage({
      getJSONSchema: vi.fn().mockImplementation(() => {
        throw new Error("Schema error");
      }),
    });

    (JSONStorage as any).mockImplementation(() => mockStorage);

    const { result } = renderHook(() =>
      useJSONStorage(key, initialValue, options),
    );

    expect(result.current.schema).toBeNull();
  });
});
