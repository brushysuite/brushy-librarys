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
    // Arrange
    const errorMessage = "Test error message";

    // Act
    const error = new DependencyError(errorMessage);

    // Assert
    expect(error.name).toBe("BrushyDependencyError");
  });

  it("should create an error with the provided message", () => {
    // Arrange
    const errorMessage = "Test error message";

    // Act
    const error = new DependencyError(errorMessage);

    // Assert
    expect(error.message).toBe(errorMessage);
  });

  it("should log the error message", () => {
    // Arrange
    const errorMessage = "Test error message";

    // Act
    new DependencyError(errorMessage);

    // Assert
    expect(Logger.error).toHaveBeenCalledWith(errorMessage);
  });

  it("should extend the Error class", () => {
    // Arrange
    const error = new DependencyError("Test error");

    // Assert
    expect(error).toBeInstanceOf(Error);
  });

  it("should work with try/catch blocks", () => {
    // Arrange
    const errorMessage = "Caught error";
    let caughtError: Error | null = null;

    // Act
    try {
      throw new DependencyError(errorMessage);
    } catch (error) {
      caughtError = error as Error;
    }

    // Assert
    expect(caughtError).toBeInstanceOf(DependencyError);
    expect(caughtError?.message).toBe(errorMessage);
  });
});
