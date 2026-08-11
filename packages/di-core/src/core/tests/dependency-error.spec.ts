import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DependencyError } from "../dependency-error";
import { Logger } from "../logger";

describe("DependencyError", () => {
  beforeEach(() => {
    vi.spyOn(Logger, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("should create an error with the correct name", () => {
    const errorMessage = "Test error message";

    const error = new DependencyError(errorMessage);

    expect(error.name).toBe("BrushyDependencyError");
  });

  it("should create an error with the provided message", () => {
    const errorMessage = "Test error message";

    const error = new DependencyError(errorMessage);

    expect(error.message).toBe(errorMessage);
  });

  it("should log the error message", () => {
    const errorMessage = "Test error message";

    new DependencyError(errorMessage);

    expect(Logger.error).toHaveBeenCalledWith(errorMessage);
  });

  it("should extend the Error class", () => {
    const error = new DependencyError("Test error");

    expect(error).toBeInstanceOf(Error);
  });

  it("should work with try/catch blocks", () => {
    const errorMessage = "Caught error";
    let caughtError: Error | null = null;

    try {
      throw new DependencyError(errorMessage);
    } catch (error) {
      caughtError = error as Error;
    }

    expect(caughtError).toBeInstanceOf(DependencyError);
    expect(caughtError?.message).toBe(errorMessage);
  });
});
