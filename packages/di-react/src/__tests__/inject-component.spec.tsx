import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import React from "react";
import { inject } from "@brushy/di-core";
import { useInjectComponent } from "../inject-component";

const MockComponent = ({ label = "Test" }: { label?: string }) => (
  <div data-testid="mock">{label}</div>
);

describe("useInjectComponent", () => {
  it("should render resolved component", () => {
    const mockContainer = { register: vi.fn() };
    vi.spyOn(inject, "getGlobalContainer").mockReturnValue(mockContainer as never);
    vi.spyOn(inject, "resolve").mockReturnValue(MockComponent);

    const Wrapper = () => {
      const Button = useInjectComponent("BUTTON");
      return <Button label="Hello" />;
    };

    render(<Wrapper />);

    expect(screen.getByTestId("mock")).toHaveTextContent("Hello");
  });
});
