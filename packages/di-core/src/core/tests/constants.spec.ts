import { afterEach, describe, expect, it } from "vitest";
import { isDev, isNodeDev } from "../constants";

describe("constants", () => {
  const originalDev = (globalThis as { __DEV__?: boolean }).__DEV__;
  const originalNodeEnv = process.env.NODE_ENV;

  afterEach(() => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = originalDev;
    process.env.NODE_ENV = originalNodeEnv;
  });

  it("should read __DEV__ when defined", () => {
    (globalThis as { __DEV__?: boolean }).__DEV__ = true;
    expect(isDev()).toBe(true);

    (globalThis as { __DEV__?: boolean }).__DEV__ = false;
    expect(isDev()).toBe(false);
  });

  it("should fall back to NODE_ENV when __DEV__ is undefined", () => {
    delete (globalThis as { __DEV__?: boolean }).__DEV__;
    process.env.NODE_ENV = "test";
    expect(isDev()).toBe(true);

    process.env.NODE_ENV = "production";
    expect(isDev()).toBe(false);
  });

  it("should detect node development mode", () => {
    process.env.NODE_ENV = "development";
    expect(isNodeDev()).toBe(true);

    process.env.NODE_ENV = "production";
    expect(isNodeDev()).toBe(false);
  });

  it("should return false when neither __DEV__ nor NODE_ENV are defined", () => {
    delete (globalThis as { __DEV__?: boolean }).__DEV__;
    delete process.env.NODE_ENV;

    expect(isDev()).toBe(false);
  });
});
