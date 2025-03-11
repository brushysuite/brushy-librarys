import { describe, it, expect, beforeEach, afterEach } from "vitest";
import {
  Container,
  BrushyDIProvider,
  useInjectComponent,
  registerComponent,
  createComponentsProvider,
} from "../index";
import { render, screen } from "@testing-library/react";
import React from "react";
import "@testing-library/jest-dom";

type ButtonProps = {
  children?: React.ReactNode;
  variant?: string;
  className?: string;
} & React.HTMLAttributes<HTMLButtonElement>;

type CardProps = {
  children?: React.ReactNode;
  title?: string;
} & React.HTMLAttributes<HTMLDivElement>;

describe("E2E - Component Injection", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
  });

  it("should register and inject React components", () => {
    const Button = ({ children, variant = "default" }: ButtonProps) => (
      <button className={`btn btn-${variant}`}>{children}</button>
    );

    const BUTTON_COMPONENT = Symbol("BUTTON_COMPONENT");
    container.register(BUTTON_COMPONENT, { useValue: Button });

    const App = () => {
      const ButtonComponent = useInjectComponent<ButtonProps>(BUTTON_COMPONENT);
      return <ButtonComponent variant="primary">Click me</ButtonComponent>;
    };

    render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    const button = screen.getByText("Click me");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("btn", "btn-primary");
  });

  it("should support fallback components when using useInjectComponent", () => {
    const FallbackButton = ({ children }: ButtonProps) => (
      <button className="fallback-btn">{children}</button>
    );

    const App = () => {
      const ButtonComponent = useInjectComponent<ButtonProps>(
        "NOT_REGISTERED_BUTTON",
        FallbackButton,
      );
      return <ButtonComponent>Fallback Button</ButtonComponent>;
    };

    render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    const button = screen.getByText("Fallback Button");
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass("fallback-btn");
  });

  it("should register components with registerComponent utility", () => {
    const Button = ({ children, variant = "default" }: ButtonProps) => (
      <button className={`btn btn-${variant}`}>{children}</button>
    );

    const Card = ({ children, title }: CardProps) => (
      <div className="card">
        {title && <h3 className="card-title">{title}</h3>}
        <div className="card-body">{children}</div>
      </div>
    );

    const BUTTON = Symbol("BUTTON");
    const CARD = Symbol("CARD");

    registerComponent(BUTTON, Button);
    registerComponent(CARD, Card);

    const App = () => {
      const ButtonComponent = useInjectComponent<ButtonProps>(BUTTON);
      const CardComponent = useInjectComponent<CardProps>(CARD);

      return (
        <CardComponent title="Test Card">
          <ButtonComponent variant="primary">Click me</ButtonComponent>
        </CardComponent>
      );
    };

    render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    expect(screen.getByText("Test Card")).toBeInTheDocument();
    expect(screen.getByText("Click me")).toBeInTheDocument();
    expect(screen.getByText("Click me")).toHaveClass("btn", "btn-primary");
  });

  it("should create components provider with createComponentsProvider", async () => {
    const Button = ({ children, variant = "default" }: ButtonProps) => (
      <button className={`btn btn-${variant}`}>{children}</button>
    );

    const Card = ({ children, title }: CardProps) => (
      <div className="card" data-testid="card">
        {title && <h3 data-testid="card-title">{title}</h3>}
        <div data-testid="card-content">{children}</div>
      </div>
    );

    const BUTTON = Symbol("BUTTON");
    const CARD = Symbol("CARD");

    registerComponent(BUTTON, Button);
    registerComponent(CARD, Card);

    const ComponentsProvider = createComponentsProvider({
      [BUTTON]: Button,
      [CARD]: Card,
    });

    const App = () => {
      const ButtonComponent = useInjectComponent<ButtonProps>(BUTTON);
      const CardComponent = useInjectComponent<CardProps>(CARD);

      return (
        <CardComponent title="Provider Test">
          <ButtonComponent variant="secondary">Provider Button</ButtonComponent>
        </CardComponent>
      );
    };

    render(
      <BrushyDIProvider container={container}>
        <ComponentsProvider>
          <App />
        </ComponentsProvider>
      </BrushyDIProvider>,
    );

    const cardTitle = screen.getByTestId("card-title");
    const button = screen.getByText("Provider Button");

    expect(cardTitle).toHaveTextContent("Provider Test");
    expect(button).toBeInTheDocument();
  });

  it("should allow component overriding", () => {
    const DefaultButton = ({ children }: ButtonProps) => (
      <button className="default-btn">{children}</button>
    );

    const CustomButton = ({ children }: ButtonProps) => (
      <button className="custom-btn">{children}</button>
    );

    const BUTTON = Symbol("BUTTON");
    registerComponent(BUTTON, DefaultButton);

    const App = () => {
      const ButtonComponent = useInjectComponent<ButtonProps>(BUTTON);
      return <ButtonComponent>Button Text</ButtonComponent>;
    };

    const { unmount } = render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    expect(screen.getByText("Button Text")).toHaveClass("default-btn");

    unmount();

    registerComponent(BUTTON, CustomButton);

    render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    expect(screen.getByText("Button Text")).toHaveClass("custom-btn");
  });

  it("should support default props in injected components", () => {
    const Button = ({ children, variant = "default" }: ButtonProps) => (
      <button className={`btn btn-${variant}`}>{children}</button>
    );

    const BUTTON = Symbol("BUTTON");
    registerComponent(BUTTON, Button);

    const App = () => {
      const ButtonComponent = useInjectComponent<ButtonProps>(BUTTON);
      return <ButtonComponent variant="primary">Default Props</ButtonComponent>;
    };

    render(
      <BrushyDIProvider container={container}>
        <App />
      </BrushyDIProvider>,
    );

    expect(screen.getByText("Default Props")).toHaveClass("btn", "btn-primary");
  });
});
