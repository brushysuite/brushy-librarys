import { describe, expect, it } from "vitest";
import { Logger } from "./classes.js";

describe("fixture classes", () => {
  it("exposes noop logger helper", () => {
    expect(() => new Logger().log("hello")).not.toThrow();
  });
});
