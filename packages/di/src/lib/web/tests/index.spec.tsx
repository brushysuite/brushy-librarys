import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BrushyDIProvider } from "../index";
import { containerRegistry } from "../..";
import { Container } from "../../../core/container";

// Mock do containerRegistry
vi.mock("../..", () => ({
  containerRegistry: {
    registerContainer: vi.fn(),
    hasDefaultContainer: vi.fn(),
    setDefaultContainer: vi.fn(),
    getContainer: vi.fn(),
  },
}));

// Mock do useEffect para testar o cleanup
let effectCleanup: (() => void) | undefined;
vi.mock("react", async () => {
  const actual = await vi.importActual("react");
  return {
    ...actual,
    useEffect: vi.fn((callback) => {
      effectCleanup = callback();
    }),
  };
});

describe("BrushyDIProvider", () => {
  const mockContainer = {} as Container;
  const mockChildren = <div>Test Children</div>;

  beforeEach(() => {
    vi.clearAllMocks();
    effectCleanup = undefined;
  });

  afterEach(() => {
    cleanup();
  });

  it("should register the container with the provided scope", () => {
    // Arrange
    const mockScope = { request: "test-request" };

    // Act
    render(
      <BrushyDIProvider container={mockContainer} scope={mockScope}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    // Assert
    expect(containerRegistry.registerContainer).toHaveBeenCalledWith(
      mockScope,
      mockContainer,
    );
  });

  it("should register the container with an empty object when no scope is provided", () => {
    // Act
    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    // Assert
    expect(containerRegistry.registerContainer).toHaveBeenCalledWith(
      {},
      mockContainer,
    );
  });

  it("should set the container as default if no default container exists", () => {
    // Arrange
    vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(false);

    // Act
    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    // Assert
    expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
    expect(containerRegistry.setDefaultContainer).toHaveBeenCalledWith(
      mockContainer,
    );
  });

  it("should not set the container as default if a default container already exists", () => {
    // Arrange
    vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(true);

    // Act
    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    // Assert
    expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
    expect(containerRegistry.setDefaultContainer).not.toHaveBeenCalled();
  });

  it("should render children correctly", () => {
    // Act
    const { container } = render(
      <BrushyDIProvider container={mockContainer}>
        <div data-testid="test-child">Test Content</div>
      </BrushyDIProvider>,
    );

    // Assert
    expect(container.innerHTML).toContain("Test Content");
  });

  it("should not unregister the container if it is the default container", () => {
    // Arrange
    vi.mocked(containerRegistry.getContainer).mockReturnValue(mockContainer);

    // Act
    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    // Execute o cleanup do useEffect
    if (effectCleanup) {
      effectCleanup();
    }

    // Assert
    expect(containerRegistry.getContainer).toHaveBeenCalled();
  });
});
