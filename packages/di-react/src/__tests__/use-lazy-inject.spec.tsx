import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInjectLazy } from "../use-lazy-inject";
import { Container } from "@brushy/di-core";

const mockContainer = {
  resolve: vi.fn(),
} as unknown as Container;

vi.mock("../context", () => ({
  useDIContainer: () => mockContainer,
}));

describe("useInjectLazy", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
});
