import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BrushyDIProvider } from "../provider";
import { containerRegistry, Container } from "@brushy/di-core";
import { ROOT_SCOPE } from "../context";

vi.mock("@brushy/di-core", async () => {
  const actual = await vi.importActual<typeof import("@brushy/di-core")>(
    "@brushy/di-core",
  );
  return {
    ...actual,
    containerRegistry: {
      registerContainer: vi.fn(),
      hasDefaultContainer: vi.fn(),
      setDefaultContainer: vi.fn(),
      getContainer: vi.fn(),
    },
  };
});

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

  it("should register with ROOT_SCOPE when no scope is provided", () => {
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
});
