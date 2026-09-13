import { render, renderHook, screen } from "@testing-library/react";
import type React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import "@testing-library/jest-dom/vitest";
import { Container, createToken, inject, isDev } from "@brushy/di-core";
import {
  createComponentsProvider,
  handleComponentNotFound,
  handleResolveError,
  registerComponent,
  registerComponents,
  renderErrorUI,
  setInjectComponentErrorRenderer,
  useInjectComponent,
} from "../inject-component";
import { BrushyDIProvider } from "../provider";

vi.mock("@brushy/di-core", async () => {
  const actual = await vi.importActual<typeof import("@brushy/di-core")>("@brushy/di-core");
  return {
    ...actual,
    isDev: vi.fn(() => true),
  };
});

const MockComponent = ({
  label = "Test",
  children,
}: {
  label?: string;
  children?: React.ReactNode;
}) => (
  <div data-testid="mock">
    {label}
    {children}
  </div>
);

const FallbackComponent = ({
  label = "Fallback",
  children,
}: {
  label?: string;
  children?: React.ReactNode;
}) => (
  <div data-testid="fallback">
    {label}
    {children}
  </div>
);

describe("useInjectComponent", () => {
  beforeEach(() => {
    vi.mocked(isDev).mockReturnValue(true);
  });

  afterEach(() => {
    setInjectComponentErrorRenderer(null);
    vi.mocked(isDev).mockReturnValue(true);
  });

  it("should render resolved component from provider context", () => {
    const container = new Container();
    const BUTTON = container.register(createToken("BUTTON"), {
      useValue: MockComponent,
    });

    const Wrapper = () => {
      const Button = useInjectComponent(BUTTON);
      return <Button label="Hello" />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("mock")).toHaveTextContent("Hello");
  });

  it("should use the fallback component when resolution fails", () => {
    const container = new Container();
    const MISSING = createToken<typeof MockComponent>("MISSING");

    const Wrapper = () => {
      const Button = useInjectComponent(MISSING, FallbackComponent);
      return <Button label="Fallback" />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("fallback")).toHaveTextContent("Fallback");
  });

  it("should return a stable component reference between rerenders", () => {
    const container = new Container();
    const BUTTON_TOKEN = Symbol("BUTTON");
    const BUTTON = container.register(BUTTON_TOKEN, {
      useValue: MockComponent,
    });

    const { result, rerender } = renderHook(() => useInjectComponent(BUTTON), {
      wrapper: ({ children }) => (
        <BrushyDIProvider container={container}>{children}</BrushyDIProvider>
      ),
    });

    const first = result.current;
    rerender();
    expect(result.current).toBe(first);
  });

  it("should render dev error UI when resolve fails without fallback", () => {
    const container = new Container();
    const MISSING = createToken<typeof MockComponent>("MISSING_DEV");

    const Wrapper = () => {
      const Missing = useInjectComponent(MISSING);
      return <Missing />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByText(/Error resolving component/)).toBeInTheDocument();
  });

  it("should render dev error UI when resolve throws without fallback", () => {
    const container = new Container();
    const BROKEN = createToken<typeof MockComponent>("BROKEN");

    container.register(BROKEN, {
      useFactory: () => {
        throw new Error("boom");
      },
    });

    const Wrapper = () => {
      const Broken = useInjectComponent(BROKEN);
      return <Broken />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByText(/Error resolving component/)).toBeInTheDocument();
    expect(screen.getByText("boom")).toBeInTheDocument();
  });

  it("should render not-found UI when resolved value is not a component", () => {
    const container = new Container();
    const NOT_A_COMPONENT = createToken<typeof MockComponent>("NOT_A_COMPONENT_UI");

    container.register(NOT_A_COMPONENT, {
      useValue: "not-a-component" as unknown as typeof MockComponent,
    });

    const Wrapper = () => {
      const Component = useInjectComponent(NOT_A_COMPONENT);
      return <Component />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByText(/Component not found/)).toBeInTheDocument();
  });

  it("should use fallback when resolved value is not a component", () => {
    const container = new Container();
    const NOT_A_COMPONENT = createToken<typeof MockComponent>("NOT_A_COMPONENT");

    container.register(NOT_A_COMPONENT, {
      useValue: "not-a-component" as unknown as typeof MockComponent,
    });

    const Wrapper = () => {
      const Component = useInjectComponent(NOT_A_COMPONENT, FallbackComponent);
      return <Component label="Fallback" />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("fallback")).toHaveTextContent("Fallback");
  });

  it("should return null in production when token is missing without fallback", () => {
    vi.mocked(isDev).mockReturnValue(false);
    const container = new Container();
    const MISSING = createToken<typeof MockComponent>("MISSING_PROD");

    const Wrapper = () => {
      const Missing = useInjectComponent(MISSING);
      return <Missing data-testid="missing" />;
    };

    const { container: rendered } = render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(rendered.querySelector("[data-testid='missing']")).toBeNull();
  });
});

describe("error handlers", () => {
  afterEach(() => {
    setInjectComponentErrorRenderer(null);
    vi.mocked(isDev).mockReturnValue(true);
  });

  it("should return null from handleComponentNotFound in production", () => {
    vi.mocked(isDev).mockReturnValue(false);
    const token = createToken("PROD_MISSING");

    expect(handleComponentNotFound(token, false)).toBeNull();
  });

  it("should return null from handleResolveError in production", () => {
    const token = createToken("PROD_ERROR");

    expect(handleResolveError(token, new Error("fail"), false)).toBeNull();
  });

  it("should stringify non-Error resolve failures in dev", () => {
    const token = createToken("STRING_ERROR");
    render(handleResolveError(token, "plain failure", true));

    expect(screen.getByText("plain failure")).toBeInTheDocument();
  });
});

describe("renderErrorUI", () => {
  const originalDocument = globalThis.document;

  afterEach(() => {
    setInjectComponentErrorRenderer(null);
    vi.stubGlobal("document", originalDocument);
  });

  it("should use a custom error renderer when configured", () => {
    setInjectComponentErrorRenderer((message, details) => (
      <div data-testid="custom-error">
        {message}
        {details}
      </div>
    ));

    render(renderErrorUI("missing token", "details here"));

    expect(screen.getByTestId("custom-error")).toHaveTextContent("missing tokendetails here");
  });

  it("should render default DOM error UI in jsdom when no custom renderer is set", () => {
    render(renderErrorUI("missing token", "extra details"));

    expect(screen.getByText("Component Loading Error")).toBeInTheDocument();
    expect(screen.getByText("missing token")).toBeInTheDocument();
    expect(screen.getByText("extra details")).toBeInTheDocument();
  });

  it("should return null when DOM is unavailable and no custom renderer is set", () => {
    vi.stubGlobal("document", undefined);

    expect(renderErrorUI("missing token")).toBeNull();
  });
});

describe("registerComponent", () => {
  it("should register a single component into a container", () => {
    const container = new Container();
    const TOKEN = createToken<typeof MockComponent>("SINGLE_BUTTON");

    registerComponent(TOKEN, MockComponent, container);

    const Wrapper = () => {
      const Button = useInjectComponent(TOKEN);
      return <Button label="Single" />;
    };

    render(
      <BrushyDIProvider container={container}>
        <Wrapper />
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("mock")).toHaveTextContent("Single");
  });

  it("should register into the global container when none is provided", () => {
    const TOKEN = createToken<typeof MockComponent>("GLOBAL_BUTTON");
    const globalContainer = new Container();
    inject.setGlobalContainer(globalContainer);

    registerComponent(TOKEN, MockComponent);

    expect(globalContainer.resolve(TOKEN)).toBe(MockComponent);
  });
});

describe("registerComponents", () => {
  it("should register a map of components outside render", () => {
    const container = new Container();
    const HEADER = createToken<typeof MockComponent>("HEADER");
    const FOOTER = createToken<typeof MockComponent>("FOOTER");

    registerComponents(container, {
      [HEADER]: MockComponent,
      [FOOTER]: MockComponent,
    });

    const App = () => {
      const Header = useInjectComponent(HEADER);
      const Footer = useInjectComponent(FOOTER);
      return (
        <>
          <Header label="Header" />
          <Footer label="Footer" />
        </>
      );
    };

    render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    expect(screen.getAllByTestId("mock")).toHaveLength(2);
  });

  it("should skip falsy component entries", () => {
    const container = new Container();
    const HEADER = createToken<typeof MockComponent>("HEADER");
    const registerSpy = vi.spyOn(container, "register");

    registerComponents(container, {
      [HEADER]: undefined as unknown as typeof MockComponent,
    });

    expect(registerSpy).not.toHaveBeenCalled();
  });
});

describe("createComponentsProvider", () => {
  it("should register components once and render children", () => {
    const container = new Container();
    const CARD = createToken<typeof MockComponent>("CARD");

    const ComponentsProvider = createComponentsProvider({
      [CARD]: MockComponent,
    });

    const App = () => {
      const Card = useInjectComponent(CARD);
      return <Card label="Card" />;
    };

    render(
      <BrushyDIProvider container={container}>
        <ComponentsProvider>
          <App />
        </ComponentsProvider>
      </BrushyDIProvider>,
    );

    expect(screen.getByTestId("mock")).toHaveTextContent("Card");
  });

  it("should call registerComponents only on first render", () => {
    const container = new Container();
    const CARD = createToken<typeof MockComponent>("CARD");
    const registerSpy = vi.spyOn(container, "register");

    const ComponentsProvider = createComponentsProvider({
      [CARD]: MockComponent,
    });

    const { rerender } = render(
      <BrushyDIProvider container={container}>
        <ComponentsProvider>
          <div />
        </ComponentsProvider>
      </BrushyDIProvider>,
    );

    const initialCalls = registerSpy.mock.calls.length;

    rerender(
      <BrushyDIProvider container={container}>
        <ComponentsProvider>
          <div />
        </ComponentsProvider>
      </BrushyDIProvider>,
    );

    expect(registerSpy.mock.calls.length).toBe(initialCalls);
  });
});
