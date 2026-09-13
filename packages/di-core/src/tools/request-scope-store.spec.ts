import { createRequire } from "node:module";
import { afterEach, describe, expect, it, vi } from "vitest";

describe("request-scope-store", () => {
  const originalProcess = globalThis.process;

  afterEach(() => {
    vi.resetModules();
    vi.unstubAllGlobals();
    globalThis.process = originalProcess;
  });

  it("should disable ALS when process is not Node", async () => {
    vi.stubGlobal("process", { release: { name: "browser" } });
    vi.resetModules();

    const mod = await import("./request-scope-store");

    expect(mod.isRequestScopeSupported()).toBe(false);
    expect(mod.getActiveScope()).toBeUndefined();
    expect(mod.runWithActiveScope({ id: "scope" }, () => 42)).toBe(42);
    await expect(mod.runWithActiveScopeAsync({ id: "scope" }, async () => "ok")).resolves.toBe(
      "ok",
    );
  });

  it("should disable ALS when async_hooks cannot be loaded", async () => {
    const nodeRequire = createRequire(import.meta.url);
    const originalLoad = nodeRequire("node:module")._load as (
      request: string,
      parent: unknown,
      isMain: boolean,
    ) => unknown;
    const moduleRef = nodeRequire("node:module") as {
      _load: typeof originalLoad;
    };

    moduleRef._load = ((request, parent, isMain) => {
      if (request === "node:async_hooks") {
        throw new Error("async_hooks unavailable");
      }
      return originalLoad.call(moduleRef, request, parent, isMain);
    }) as typeof originalLoad;

    vi.resetModules();

    try {
      const mod = await import("./request-scope-store");

      expect(mod.isRequestScopeSupported()).toBe(false);
      expect(mod.runWithActiveScope({ id: "scope" }, () => "fallback")).toBe("fallback");
    } finally {
      moduleRef._load = originalLoad;
    }
  });
});
