import React from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, renderHook, cleanup } from "@testing-library/react";
import { Container, createToken } from "@brushy/di-core";
import { BrushyDIProvider, DIContext, useDIContainer, useInject } from "../";

describe("cross-platform smoke", () => {
  afterEach(() => {
    cleanup();
  });

  it("useDIContainer reads from Context without registry fallback", () => {
    const container = new Container();
    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <DIContext.Provider value={container}>{children}</DIContext.Provider>
    );

    const { result } = renderHook(() => useDIContainer(), { wrapper });

    expect(result.current).toBe(container);
  });

  it("useInject works with Context-only provider", () => {
    const container = new Container();
    const TOKEN = container.register(createToken("VALUE"), {
      useValue: "hello",
    });
    const wrapper = ({ children }: { children?: React.ReactNode }) => (
      <DIContext.Provider value={container}>{children}</DIContext.Provider>
    );

    const { result } = renderHook(() => useInject(TOKEN), { wrapper });

    expect(result.current).toBe("hello");
  });

  it("BrushyDIProvider makes container available via Context", () => {
    const container = new Container();
    const TOKEN = container.register(createToken("VALUE"), {
      useValue: "world",
    });

    const Test = () => {
      const value = useInject(TOKEN);
      return <span>{value}</span>;
    };

    const { container: rendered } = render(
      <BrushyDIProvider container={container}>
        <Test />
      </BrushyDIProvider>,
    );

    expect(rendered.textContent).toBe("world");
  });
});
