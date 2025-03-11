import React from "react";
import {
  describe,
  it,
  expect,
  vi,
  beforeEach,
  afterEach,
  afterAll,
} from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("../inject", () => ({
  inject: {
    resolve: vi.fn(),
    getGlobalContainer: vi.fn(),
  },
}));

const originalNodeEnv = process.env.NODE_ENV;

import {
  useInjectComponent,
  createComponentsProvider,
  registerComponent,
  componentCache,
  renderErrorUI,
  handleComponentNotFound,
  handleResolveError,
} from "../inject-component";
import { inject } from "../inject";

const originalUseMemo = React.useMemo;
React.useMemo = function (factory, deps) {
  return factory();
};

const originalConsoleError = console.error;
beforeEach(() => {
  console.error = vi.fn();
  componentCache.clear();
});

afterEach(() => {
  console.error = originalConsoleError;
  vi.resetAllMocks();
  process.env.NODE_ENV = originalNodeEnv;
});

afterAll(() => {
  React.useMemo = originalUseMemo;
});

interface MockComponentProps extends React.JSX.IntrinsicAttributes {
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

const MockComponent: React.FC<MockComponentProps> = ({
  label = "Mock Component",
  className = "",
  children,
}) => (
  <div data-testid="mock-component" className={className}>
    {label}
    {children}
  </div>
);

const FallbackComponent: React.FC<MockComponentProps> = ({
  label = "Fallback Component",
  className = "",
  children,
}) => (
  <div data-testid="fallback-component" className={className}>
    {label}
    {children}
  </div>
);

describe("useInjectComponent", () => {
  const TOKEN = "TEST_COMPONENT";

  beforeEach(() => {
    vi.clearAllMocks();
    componentCache.clear();
  });

  it("should render the injected component", () => {
    vi.mocked(inject.resolve).mockReturnValue(MockComponent);

    const TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    render(<TestComponent label="Test" />);

    expect(screen.getByTestId("mock-component")).toBeInTheDocument();
    expect(screen.getByText("Test")).toBeInTheDocument();
    expect(inject.resolve).toHaveBeenCalledWith(TOKEN);
    expect(componentCache.has(TOKEN)).toBe(true);
  });

  it("should pass props to the injected component", () => {
    vi.mocked(inject.resolve).mockReturnValue(MockComponent);

    const TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    render(<TestComponent label="Custom Label" className="custom-class" />);

    const component = screen.getByTestId("mock-component");
    expect(component).toHaveTextContent("Custom Label");
    expect(component).toHaveClass("custom-class");
  });

  it("should render component from cache when available", () => {
    componentCache.set(TOKEN, MockComponent);

    const TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    render(<TestComponent label="Cached Component" />);

    expect(screen.getByTestId("mock-component")).toBeInTheDocument();
    expect(screen.getByText("Cached Component")).toBeInTheDocument();

    expect(inject.resolve).not.toHaveBeenCalled();
  });

  it("should render the fallback component when injection fails", () => {
    vi.mocked(inject.resolve).mockImplementation(() => {
      throw new Error("Component not found");
    });

    const TestComponent = useInjectComponent<MockComponentProps>(
      TOKEN,
      FallbackComponent,
    );
    render(<TestComponent label="Fallback Label" />);

    expect(screen.getByText("Fallback Label")).toBeInTheDocument();
  });

  it("should render the fallback component when resolved component is not a function", () => {
    vi.mocked(inject.resolve).mockReturnValue({} as any);

    const TestComponent = useInjectComponent<MockComponentProps>(
      TOKEN,
      FallbackComponent,
    );
    render(<TestComponent label="Fallback for Non-Function" />);

    expect(screen.getByText("Fallback for Non-Function")).toBeInTheDocument();
  });

  it("should set displayName correctly", () => {
    vi.mocked(inject.resolve).mockReturnValue(MockComponent);

    const TestComponent = useInjectComponent<MockComponentProps>(TOKEN);

    expect(TestComponent.displayName).toBe(`Injected(${TOKEN})`);
  });

  it("should handle development and production environments", () => {
    process.env.NODE_ENV = "development";

    vi.mocked(inject.resolve).mockImplementation(() => {
      throw new Error("Component not found");
    });

    let TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    let { container } = render(<TestComponent />);

    expect(console.error).toHaveBeenCalled();
    expect(container.textContent).toContain("Component Loading Error");

    vi.clearAllMocks();

    vi.mocked(inject.resolve).mockReturnValue({} as any);

    TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    container = render(<TestComponent />).container;

    expect(console.error).toHaveBeenCalled();
    expect(container.textContent).toContain("Component Loading Error");

    vi.clearAllMocks();

    vi.mocked(inject.resolve).mockImplementation(() => {
      throw "String error";
    });

    TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    container = render(<TestComponent />).container;

    expect(console.error).toHaveBeenCalled();
    expect(container.textContent).toContain("String error");

    vi.clearAllMocks();

    process.env.NODE_ENV = "production";

    vi.mocked(inject.resolve).mockImplementation(() => {
      throw new Error("Component not found");
    });

    TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    container = render(<TestComponent />).container;

    expect(console.error).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();

    vi.clearAllMocks();

    vi.mocked(inject.resolve).mockReturnValue({} as any);

    TestComponent = useInjectComponent<MockComponentProps>(TOKEN);
    container = render(<TestComponent />).container;

    expect(console.error).toHaveBeenCalled();
    expect(container.firstChild).toBeNull();
  });
});

describe("createComponentsProvider", () => {
  const mockContainer = {
    register: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(inject.getGlobalContainer).mockReturnValue(mockContainer as any);
  });

  it("should register components immediately", () => {
    const components = {
      BUTTON: MockComponent,
      CARD: FallbackComponent,
    };

    createComponentsProvider(components);

    expect(inject.getGlobalContainer).toHaveBeenCalled();
    expect(mockContainer.register).toHaveBeenCalledTimes(2);
    expect(mockContainer.register).toHaveBeenCalledWith("BUTTON", {
      useValue: MockComponent,
    });
    expect(mockContainer.register).toHaveBeenCalledWith("CARD", {
      useValue: FallbackComponent,
    });
  });

  it("should render children", () => {
    const components = {
      BUTTON: MockComponent,
    };

    const Provider = createComponentsProvider(components);
    render(
      <Provider>
        <div data-testid="child">Child Content</div>
      </Provider>,
    );

    expect(screen.getByTestId("child")).toBeInTheDocument();
    expect(screen.getByText("Child Content")).toBeInTheDocument();
  });

  it("should set displayName correctly", () => {
    const components = {
      BUTTON: MockComponent,
    };

    const Provider = createComponentsProvider(components);

    expect(Provider.displayName).toBe("BrushyDIComponentProvider");
  });
});

describe("registerComponent", () => {
  const mockContainer = {
    register: vi.fn(),
  };

  beforeEach(() => {
    vi.mocked(inject.getGlobalContainer).mockReturnValue(mockContainer as any);
  });

  it("should register a component in the container", () => {
    const TOKEN = "BUTTON_COMPONENT";

    registerComponent(TOKEN, MockComponent);

    expect(inject.getGlobalContainer).toHaveBeenCalled();
    expect(mockContainer.register).toHaveBeenCalledWith(TOKEN, {
      useValue: MockComponent,
    });
  });
});

describe("Helper functions", () => {
  it("should render error UI correctly", () => {
    const { container } = render(
      renderErrorUI("Test error message", "Error details"),
    );

    expect(container.textContent).toContain("Component Loading Error");
    expect(container.textContent).toContain("Test error message");
    expect(container.textContent).toContain("Error details");
  });

  it("should handle component not found in development", () => {
    const result = handleComponentNotFound("TEST_TOKEN", true);
    const { container } = render(<>{result}</>);

    expect(console.error).toHaveBeenCalledWith(
      "Component not found for token: TEST_TOKEN",
    );
    expect(container.textContent).toContain("Component Loading Error");
    expect(container.textContent).toContain("Component not found: TEST_TOKEN");
  });

  it("should handle component not found in production", () => {
    const result = handleComponentNotFound("TEST_TOKEN", false);

    expect(console.error).toHaveBeenCalledWith(
      "Component not found for token: TEST_TOKEN",
    );
    expect(result).toBeNull();
  });

  it("should handle resolve error with Error instance in development", () => {
    const error = new Error("Test error message");
    const result = handleResolveError("TEST_TOKEN", error, true);
    const { container } = render(<>{result}</>);

    expect(console.error).toHaveBeenCalledWith(
      "Error resolving component for token: TEST_TOKEN",
      error,
    );
    expect(container.textContent).toContain("Component Loading Error");
    expect(container.textContent).toContain(
      "Error resolving component: TEST_TOKEN",
    );
    expect(container.textContent).toContain("Test error message");
  });

  it("should handle resolve error with non-Error in development", () => {
    const error = "String error";
    const result = handleResolveError("TEST_TOKEN", error, true);
    const { container } = render(<>{result}</>);

    expect(console.error).toHaveBeenCalledWith(
      "Error resolving component for token: TEST_TOKEN",
      error,
    );
    expect(container.textContent).toContain("Component Loading Error");
    expect(container.textContent).toContain(
      "Error resolving component: TEST_TOKEN",
    );
    expect(container.textContent).toContain("String error");
  });

  it("should handle resolve error in production", () => {
    const error = new Error("Test error message");
    const result = handleResolveError("TEST_TOKEN", error, false);

    expect(console.error).toHaveBeenCalledWith(
      "Error resolving component for token: TEST_TOKEN",
      error,
    );
    expect(result).toBeNull();
  });
});
