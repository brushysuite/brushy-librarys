import { Container, containerRegistry, DependencyError } from "@brushy/di-core";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { registerReactContainer, unregisterReactContainer, useDIContainer } from "../context";

describe("useDIContainer", () => {
  afterEach(() => {
    containerRegistry.cleanupTransientScopes();
  });

  it("should resolve from the registry when Context is unavailable", () => {
    const container = new Container();
    const scope = { id: "registry-scope" };
    containerRegistry.registerContainer(scope, container);

    const { result } = renderHook(() => useDIContainer(scope));

    expect(result.current).toBe(container);
  });

  it("should throw when no container is available", () => {
    expect(() => renderHook(() => useDIContainer())).toThrow(DependencyError);
  });

  it("should include non-Error registry failures in the thrown message", () => {
    const scope = { id: "broken-scope" };
    const getContainerSpy = vi.spyOn(containerRegistry, "getContainer").mockImplementation(() => {
      throw "registry failure";
    });

    expect(() => renderHook(() => useDIContainer(scope))).toThrow(/registry failure/);

    getContainerSpy.mockRestore();
  });
});

describe("deprecated registry helpers", () => {
  afterEach(() => {
    containerRegistry.cleanupTransientScopes();
  });

  it("should register and unregister via legacy helpers", () => {
    const container = new Container();
    const scope = { id: "legacy-scope" };

    registerReactContainer(scope, container);
    expect(containerRegistry.getContainer(scope)).toBe(container);

    expect(() => unregisterReactContainer(scope)).not.toThrow();
  });
});
