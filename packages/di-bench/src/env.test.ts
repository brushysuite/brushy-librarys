import os from "node:os";
import { describe, expect, it, vi } from "vitest";
import { captureEnvironment } from "./env.js";

vi.mock("node:module", () => ({
  createRequire: () => (name: string) => {
    if (name.endsWith("/package.json")) {
      return { version: "9.9.9" };
    }
    throw new Error(`missing ${name}`);
  },
}));

describe("captureEnvironment", () => {
  it("captures runtime metadata and package versions", () => {
    const env = captureEnvironment(1000, 2, "all", "brushy,baseline");

    expect(env.node).toBe(process.version);
    expect(env.platform).toBe(process.platform);
    expect(env.arch).toBe(process.arch);
    expect(env.cpuCount).toBeGreaterThan(0);
    expect(env.benchConfig).toEqual({
      timeMs: 1000,
      runs: 2,
      scenarios: "all",
      libs: "brushy,baseline",
    });
    expect(env.packageVersions?.brushy).toBe("9.9.9");
  });

  it("falls back when cpu metadata is unavailable", () => {
    const cpusSpy = vi.spyOn(os, "cpus").mockReturnValue([] as os.CpuInfo[]);
    const env = captureEnvironment(500, 1, "transient", "all");
    expect(env.cpuModel).toBe("unknown");
    cpusSpy.mockRestore();
  });

  it("returns unknown package versions when lookup fails", async () => {
    vi.resetModules();
    vi.doMock("node:module", () => ({
      createRequire: () => () => {
        throw new Error("missing");
      },
    }));

    const { captureEnvironment: captureWithoutPackages } = await import("./env.js");
    const env = captureWithoutPackages(500, 1, "transient", "all");

    expect(env.packageVersions?.brushy).toBe("unknown");
  });
});
