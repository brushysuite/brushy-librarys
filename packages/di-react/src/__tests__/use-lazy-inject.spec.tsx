import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { DependencyError } from "@brushy/di-core";
import type { Container } from "@brushy/di-core";
import { useDIContainer } from "../context";
import { useInjectLazy } from "../use-lazy-inject";

const mockContainer = {
  resolve: vi.fn(),
} as unknown as Container;

vi.mock("../context", () => ({
  useDIContainer: vi.fn(() => mockContainer),
}));

describe("useInjectLazy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useDIContainer).mockReturnValue(mockContainer);
    vi.mocked(mockContainer.resolve).mockReturnValue({
      getValue: () => "lazy-value",
    });
  });

  it("should resolve on first access", () => {
    const { result } = renderHook(() =>
      useInjectLazy<{ getValue: () => string }>("TOKEN"),
    );

    expect(mockContainer.resolve).not.toHaveBeenCalled();
    expect(result.current.getValue()).toBe("lazy-value");
    expect(mockContainer.resolve).toHaveBeenCalledTimes(1);
  });

  it("should throw when token is missing", () => {
    expect(() => renderHook(() => useInjectLazy("" as never))).toThrow(
      /Token is required/,
    );
  });

  it("should throw when resolved instance is not an object", () => {
    vi.mocked(mockContainer.resolve).mockReturnValue("not-an-object");

    const { result } = renderHook(() => useInjectLazy<{ value: string }>("TOKEN"));

    expect(() => result.current.value).toThrow(/Invalid service instance/);
  });

  it("should throw when property is missing on the resolved instance", () => {
    const { result } = renderHook(() => useInjectLazy<{ missing: string }>("TOKEN"));

    expect(() => result.current.missing).toThrow(/not found in service/);
  });

  it("should wrap unknown resolve failures as DependencyError", () => {
    vi.mocked(mockContainer.resolve).mockImplementation(() => {
      throw new Error("resolve failed");
    });

    const { result } = renderHook(() => useInjectLazy<{ value: string }>("TOKEN"));

    expect(() => result.current.value).toThrow(DependencyError);
    expect(() => result.current.value).toThrow(/resolve failed/);
  });

  it("should resolve using an explicit scope option", () => {
    const scope = { id: "lazy-scope" };
    const scopedContainer = {
      resolve: vi.fn().mockReturnValue({ value: "scoped" }),
    } as unknown as Container;

    vi.mocked(useDIContainer).mockReturnValue(scopedContainer);

    const { result } = renderHook(() =>
      useInjectLazy<{ value: string }>("TOKEN", { scope }),
    );

    expect(result.current.value).toBe("scoped");
    expect(useDIContainer).toHaveBeenCalledWith(scope);
  });

  it("should rethrow DependencyError from the proxy getter", () => {
    const dependencyError = new DependencyError("already wrapped");
    vi.mocked(mockContainer.resolve).mockImplementation(() => {
      throw dependencyError;
    });

    const { result } = renderHook(() => useInjectLazy<{ value: string }>("TOKEN"));

    expect(() => result.current.value).toThrow(dependencyError);
  });

  it("should stringify non-Error resolve failures", () => {
    vi.mocked(mockContainer.resolve).mockImplementation(() => {
      throw "plain failure";
    });

    const { result } = renderHook(() => useInjectLazy<{ value: string }>("TOKEN"));

    expect(() => result.current.value).toThrow(/plain failure/);
  });
});
