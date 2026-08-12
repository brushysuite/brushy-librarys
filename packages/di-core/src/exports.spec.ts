import { describe, expect, it } from "vitest";
import type { ProviderConfig } from "./types/index";
import * as root from "./index";
import * as containerEntry from "./entries/container";
import * as cacheEntry from "./entries/cache";
import * as injectEntry from "./entries/inject";
import * as resolveEntry from "./entries/resolve";
import * as requestScopeEntry from "./entries/request-scope";
import * as serverEntry from "./entries/server";

describe("public exports", () => {
  it("should expose core APIs from the root entrypoint", () => {
    const config: ProviderConfig = { useValue: 1 };
    expect(config.useValue).toBe(1);
    expect(root.Container).toBeTypeOf("function");
    expect(root.createToken).toBeTypeOf("function");
    expect(root.inject).toBeDefined();
    expect(root.resolve).toBeDefined();
    expect(root.cache).toBeDefined();
    expect(root.runInRequestScope).toBeTypeOf("function");
  });

  it("should expose subpath entrypoints", () => {
    expect(containerEntry.Container).toBe(root.Container);
    expect(cacheEntry.cache).toBe(root.cache);
    expect(injectEntry.inject).toBe(root.inject);
    expect(resolveEntry.resolve).toBe(root.resolve);
    expect(requestScopeEntry.runInRequestScope).toBe(root.runInRequestScope);
    expect(serverEntry.server).toBe(root.server);
  });
});
