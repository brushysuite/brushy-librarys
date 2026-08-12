import React, { useContext } from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { BrushyDIProvider } from "../provider";
import { DIContext, bridgeContainer } from "../context";
import { containerRegistry, Container, createToken } from "@brushy/di-core";

vi.mock("@brushy/di-core", async () => {
  const actual = await vi.importActual<typeof import("@brushy/di-core")>(
    "@brushy/di-core",
  );
  return {
    ...actual,
    containerRegistry: {
      registerContainer: vi.fn((scope, container) => {
        actual.containerRegistry.registerContainer(scope, container);
      }),
      hasDefaultContainer: vi.fn(() => actual.containerRegistry.hasDefaultContainer()),
      setDefaultContainer: vi.fn((container) => {
        actual.containerRegistry.setDefaultContainer(container);
      }),
      getContainer: vi.fn((scope) => actual.containerRegistry.getContainer(scope)),
      unregisterContainer: vi.fn((scope) => {
        actual.containerRegistry.unregisterContainer(scope);
      }),
      cleanupTransientScopes: vi.fn(() => {
        actual.containerRegistry.cleanupTransientScopes();
      }),
    },
  };
});

describe("BrushyDIProvider", () => {
  const container = new Container();
  const TOKEN = createToken<string>("PROVIDER_TEST");
  container.register(TOKEN, { useValue: "from-context" });

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
    containerRegistry.cleanupTransientScopes();
  });

  it("should provide the container via Context without registering in the registry", () => {
    const Spy = () => {
      const ctx = useContext(DIContext);
      return <div data-testid="value">{ctx?.resolve(TOKEN)}</div>;
    };

    const { getByTestId } = render(
      <BrushyDIProvider container={container}>
        <Spy />
      </BrushyDIProvider>,
    );

    expect(getByTestId("value")).toHaveTextContent("from-context");
    expect(containerRegistry.registerContainer).not.toHaveBeenCalled();
  });

  it("should render children", () => {
    const { getByText } = render(
      <BrushyDIProvider container={container}>
        <div>Test Children</div>
      </BrushyDIProvider>,
    );

    expect(getByText("Test Children")).toBeInTheDocument();
  });

  it("should not perform any side effect during render", () => {
    const resolveSpy = vi.spyOn(container, "resolve");

    render(
      <BrushyDIProvider container={container}>
        <div />
      </BrushyDIProvider>,
    );

    expect(resolveSpy).not.toHaveBeenCalled();
  });
});

describe("bridgeContainer", () => {
  const container = new Container();

  afterEach(() => {
    containerRegistry.cleanupTransientScopes();
  });

  it("should register a container outside React render and cleanup manually", () => {
    const scope = { request: "test-request" };

    expect(containerRegistry.registerContainer).not.toHaveBeenCalled();

    const cleanup = bridgeContainer(scope, container);

    expect(containerRegistry.registerContainer).toHaveBeenCalledWith(scope, container);
    expect(containerRegistry.getContainer(scope)).toBe(container);

    cleanup();

    expect(containerRegistry.unregisterContainer).toHaveBeenCalledWith(scope);
  });
});
