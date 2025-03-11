import { describe, it, expect, vi, beforeEach } from "vitest";
import { resolve } from "../resolve";
import { containerRegistry } from "../..";

vi.mock("../..", () => {
  const mockContainer = {
    resolve: vi.fn(),
  };

  return {
    containerRegistry: {
      getContainer: vi.fn(() => mockContainer),
    },
  };
});

describe("resolve", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should resolve a dependency from the container", () => {
    const token = "TestService";
    const resolvedValue = { test: "value" };
    const mockContainer = containerRegistry.getContainer();

    vi.mocked(mockContainer.resolve).mockReturnValue(resolvedValue);

    const result = resolve(token);

    expect(containerRegistry.getContainer).toHaveBeenCalledWith(undefined);
    expect(mockContainer.resolve).toHaveBeenCalledWith(token);
    expect(result).toBe(resolvedValue);
  });

  it("should resolve a dependency from a specific scope", () => {
    const token = "TestService";
    const scope = { request: "test-request" };
    const resolvedValue = { test: "scoped-value" };
    const mockContainer = containerRegistry.getContainer();

    vi.mocked(mockContainer.resolve).mockReturnValue(resolvedValue);

    const result = resolve(token, scope);

    expect(containerRegistry.getContainer).toHaveBeenCalledWith(scope);
    expect(mockContainer.resolve).toHaveBeenCalledWith(token);
    expect(result).toBe(resolvedValue);
  });
});
