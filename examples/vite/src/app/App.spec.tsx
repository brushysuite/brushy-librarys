import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import App from "./App";
import { AppProviders } from "../providers/app-providers";

describe("App", () => {
  it("renders users from DI container", () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>,
    );

    expect(screen.getByText("brushy-example")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
    expect(screen.getByText("Bruno")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Usar tema escuro" })).toBeInTheDocument();
    expect(screen.getByLabelText("Tema atual: claro")).toBeInTheDocument();
  });
});
