import { createStorage, resetStorageRegistry } from "@brushy/storage";
import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { StorageProvider } from "./context";
import { useStorage } from "./use-storage";

describe("useStorage", () => {
  afterEach(() => {
    resetStorageRegistry();
  });

  it("initializes with initial value when key is empty", () => {
    const storage = createStorage({ id: "hook-init" });
    const { result } = renderHook(() => useStorage("token", null as string | null), {
      wrapper: ({ children }) => (
        <StorageProvider storage={storage}>{children}</StorageProvider>
      ),
    });

    expect(result.current.value).toBeNull();
  });

  it("updates value", () => {
    const storage = createStorage({ id: "hook-set" });
    const { result } = renderHook(() => useStorage("count", 0), {
      wrapper: ({ children }) => (
        <StorageProvider storage={storage}>{children}</StorageProvider>
      ),
    });

    act(() => {
      result.current.set(1);
    });

    expect(result.current.value).toBe(1);
  });

  it("supports functional updates without stale closure", () => {
    const storage = createStorage({ id: "hook-fn" });
    const { result } = renderHook(() => useStorage("count", 0), {
      wrapper: ({ children }) => (
        <StorageProvider storage={storage}>{children}</StorageProvider>
      ),
    });

    act(() => {
      result.current.set((prev) => prev + 1);
      result.current.set((prev) => prev + 1);
    });

    expect(result.current.value).toBe(2);
  });

  it("removes value and falls back to initial", () => {
    const storage = createStorage({ id: "hook-remove" });
    const { result } = renderHook(() => useStorage("token", "initial"), {
      wrapper: ({ children }) => (
        <StorageProvider storage={storage}>{children}</StorageProvider>
      ),
    });

    act(() => {
      result.current.set("saved");
    });
    expect(result.current.value).toBe("saved");

    act(() => {
      result.current.remove();
    });
    expect(result.current.value).toBe("initial");
  });

  it("re-renders when another hook updates the same key", () => {
    const storage = createStorage({ id: "hook-sync" });

    const { result: a } = renderHook(() => useStorage("shared", 0), {
      wrapper: ({ children }) => (
        <StorageProvider storage={storage}>{children}</StorageProvider>
      ),
    });

    const { result: b } = renderHook(() => useStorage("shared", 0), {
      wrapper: ({ children }) => (
        <StorageProvider storage={storage}>{children}</StorageProvider>
      ),
    });

    act(() => {
      a.current.set(5);
    });

    expect(b.current.value).toBe(5);
  });
});
