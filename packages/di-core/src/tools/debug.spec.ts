import { describe, expect, it } from "vitest";
import { Container } from "../core/container";
import { createToken } from "../types/tokens";
import { enableBrushyDebug, getBrushyDebug } from "./debug";

describe("debug tools", () => {
  it("should expose the debug API after enabling", () => {
    const container = new Container();
    const TOKEN = container.register(createToken("DEBUG_VALUE"), {
      useValue: "ok",
    });

    const api = enableBrushyDebug(container);

    expect(getBrushyDebug()).toBe(api);
    expect(api.resolve(TOKEN)).toBe("ok");
    expect(api.exportProviders()).toEqual(
      expect.arrayContaining([expect.objectContaining({ token: TOKEN })]),
    );
  });

  it("should return null when debug was not enabled", () => {
    (globalThis as { __BRUSHY_DI__?: unknown }).__BRUSHY_DI__ = undefined;
    expect(getBrushyDebug()).toBeNull();
  });
});
