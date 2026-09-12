import { describe, expect, it } from "vitest";
import { createToken } from "../../types/tokens";
import { createFromProvider } from "../strategies/provider";

describe("provider strategy", () => {
  it("should return useValue when creator compilation is unavailable", () => {
    const value = { ready: true };
    const result = createFromProvider<{ ready: boolean }>(
      { useValue: value },
      () => {
        throw new Error("should not resolve dependencies");
      },
      null as never,
    );

    expect(result).toBe(value);
  });

  it("should return useValue when precompiled creator is falsy", () => {
    const value = { ready: true };
    const result = createFromProvider<{ ready: boolean }>(
      { useValue: value },
      () => {
        throw new Error("should not resolve dependencies");
      },
      "" as never,
    );

    expect(result).toBe(value);
  });

  it("should throw for invalid provider configs", () => {
    expect(() => createFromProvider("invalid" as never, () => undefined, null as never)).toThrow(
      "Invalid provider config.",
    );
  });

  it("should resolve dependencies through a precompiled creator", () => {
    const TOKEN = createToken("VALUE");
    const result = createFromProvider<string>(
      {
        useFactory: (input: string) => input.toUpperCase(),
        dependencies: [TOKEN],
      },
      (token) => (token === TOKEN ? "hello" : ""),
      (resolve) => String(resolve(TOKEN)).toUpperCase(),
    );

    expect(result).toBe("HELLO");
  });
});
