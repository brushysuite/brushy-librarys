import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BrushyDIProvider } from "../index";
import { containerRegistry } from "../..";
import { Container } from "../../../core/container";
import { ROOT_SCOPE } from "../../context";

vi.mock("../..", () => ({
  containerRegistry: {
    registerContainer: vi.fn(),
    hasDefaultContainer: vi.fn(),
    setDefaultContainer: vi.fn(),
    getContainer: vi.fn(),
  },
}));

describe("BrushyDIProvider", () => {
  const mockContainer = {} as Container;
  const mockChildren = <div>Test Children</div>;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("should register the container with the provided scope", () => {
    const mockScope = { request: "test-request" };

    render(
      <BrushyDIProvider container={mockContainer} scope={mockScope}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    expect(containerRegistry.registerContainer).toHaveBeenCalledWith(
      mockScope,
      mockContainer,
    );
  });

  it("should register the container with ROOT_SCOPE when no scope is provided", () => {
    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    expect(containerRegistry.registerContainer).toHaveBeenCalledWith(
      ROOT_SCOPE,
      mockContainer,
    );
  });

  it("should set the container as default if no default container exists", () => {
    vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(false);

    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
    expect(containerRegistry.setDefaultContainer).toHaveBeenCalledWith(
      mockContainer,
    );
  });

  it("should not set the container as default if a default container already exists", () => {
    vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(true);

    render(
      <BrushyDIProvider container={mockContainer}>
        {mockChildren}
      </BrushyDIProvider>,
    );

    expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
    expect(containerRegistry.setDefaultContainer).not.toHaveBeenCalled();
  });

  it("should render children correctly", () => {
    const { container } = render(
      <BrushyDIProvider container={mockContainer}>
        <div data-testid="test-child">Test Content</div>
      </BrushyDIProvider>,
    );

    expect(container.innerHTML).toContain("Test Content");
  });
});
