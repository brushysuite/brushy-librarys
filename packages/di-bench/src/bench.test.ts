import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { TaskResult } from "tinybench";
import { baselineAdapter } from "./adapters/baseline.js";
import { tsyringeAdapter } from "./adapters/tsyringe.js";
import {
  extractMetrics,
  hzFromPeriodMs,
  main,
  medianMs,
  msToNs,
  parseScenarios,
  runSuite,
} from "./bench.js";
import { ALL_SCENARIOS } from "./types.js";

vi.mock("tinybench", () => {
  class Bench {
    tasks: Array<{ name?: string; result?: TaskResult }> = [];

    constructor(public options: Record<string, unknown>) {}

    add(name: string, fn: () => void, hooks?: { beforeAll?: () => void; afterAll?: () => void }) {
      hooks?.beforeAll?.();
      fn();
      hooks?.afterAll?.();
      this.tasks.push({
        name,
        result: {
          hz: 1000,
          mean: 1,
          samples: [1, 2, 3],
          p75: 2,
          p99: 3,
          min: 1,
          max: 3,
          sd: 0.5,
          moe: 0.1,
          rme: 1,
        },
      });
      this.tasks.push({ name: "missing::transient" });
      this.tasks.push({ name: undefined, result: { hz: 1, mean: 1, samples: [1], p75: 1, p99: 1, min: 1, max: 1, sd: 0, moe: 0, rme: 0 } });
    }

    async warmup() {}
    async run() {}
  }

  return { Bench };
});

describe("bench helpers", () => {
  it("parses scenarios and converts metrics", () => {
    expect(parseScenarios("all")).toEqual(ALL_SCENARIOS);
    expect(parseScenarios("transient,deep_graph")).toEqual(["transient", "deep_graph"]);
    expect(medianMs([])).toBe(0);
    expect(medianMs([3, 1, 2])).toBe(2);
    expect(msToNs(2)).toBe(2_000_000);
    expect(hzFromPeriodMs(0)).toBe(0);
    expect(hzFromPeriodMs(2)).toBe(500);
  });

  it("extracts success and error task metrics", () => {
    const adapters = [baselineAdapter];
    const ok = extractMetrics(
      "baseline::transient",
      {
        hz: 1000,
        mean: 1,
        samples: [1, 2],
        p75: 2,
        p99: 3,
        min: 1,
        max: 3,
        sd: 0.5,
        moe: 0.1,
        rme: 1,
      },
      0,
      adapters,
    );
    const failed = extractMetrics(
      "unknown::transient",
      { error: new Error("failed") } as TaskResult,
      1,
      adapters,
    );
    const failedKnown = extractMetrics(
      "baseline::transient",
      { error: new Error("failed") } as TaskResult,
      1,
      adapters,
    );

    expect(ok.lib).toBe("baseline");
    expect(ok.samplesCount).toBe(2);
    expect(failed.error).toContain("failed");
    expect(failed.throughputMean).toBe(0);
    expect(failedKnown.libLabel).toBe("baseline (new)");

    const unknownLib = extractMetrics(
      "missing-lib::transient",
      {
        hz: 1000,
        mean: 1,
        samples: [1],
        p75: 1,
        p99: 1,
        min: 1,
        max: 1,
        sd: 0,
        moe: 0,
        rme: 0,
      },
      0,
      [],
    );
    expect(unknownLib.libLabel).toBe("missing-lib");
  });

  it("runs batch execution when BENCH_BATCH_SIZE is greater than one", async () => {
    vi.stubEnv("BENCH_BATCH_SIZE", "2");
    vi.stubEnv("BENCH_GC", "1");
    (globalThis as { gc?: () => void }).gc = vi.fn();

    vi.resetModules();
    const { runSuite: runBatchSuite } = await import("./bench.js");
    const metrics = await runBatchSuite([baselineAdapter], ["transient"], 0);

    expect(metrics.length).toBeGreaterThan(0);
    vi.unstubAllEnvs();
    delete (globalThis as { gc?: () => void }).gc;
  });

  it("skips unsupported adapter scenarios", async () => {
    vi.resetModules();
    const { runSuite: runFilteredSuite } = await import("./bench.js");
    const metrics = await runFilteredSuite(
      [tsyringeAdapter, baselineAdapter],
      ["request_scope", "transient"],
      0,
    );

    expect(metrics.some((metric) => metric.scenario === "transient")).toBe(true);
    expect(metrics.some((metric) => metric.scenario === "request_scope")).toBe(false);
  });
});

describe("main", () => {
  const envBackup = { ...process.env };

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = { ...envBackup };
    vi.restoreAllMocks();
  });

  it("executes end-to-end with quick settings", async () => {
    process.env.BENCH_TIME_MS = "10";
    process.env.BENCH_RUNS = "1";
    process.env.BENCH_SCENARIOS = "transient";
    process.env.BENCH_LIBS = "baseline";
    process.env.BENCH_MAX_ITERATIONS = "10";

    vi.resetModules();
    const { main: runMain } = await import("./bench.js");
    await expect(runMain()).resolves.toBeUndefined();
  });

  it("warns when checksum sink stays zero", async () => {
    process.env.BENCH_TIME_MS = "10";
    process.env.BENCH_RUNS = "1";
    process.env.BENCH_SCENARIOS = "transient";
    process.env.BENCH_LIBS = "baseline";
    process.env.BENCH_MAX_ITERATIONS = "10";

    vi.resetModules();
    vi.doMock("./fixtures/checksum.js", () => ({
      consumeChecksum: () => 0,
      getGlobalChecksum: () => 0,
      resetGlobalChecksum: () => {},
    }));

    const warnSpy = vi.spyOn(console, "warn");
    const { main: runMain } = await import("./bench.js");
    await runMain();

    expect(warnSpy).toHaveBeenCalledWith(
      "Checksum sink is zero - results may have been eliminated.",
    );
  });

  it("logs partial-run warning when not all scenarios execute", async () => {
    process.env.BENCH_TIME_MS = "10";
    process.env.BENCH_RUNS = "1";
    process.env.BENCH_SCENARIOS = "transient";
    process.env.BENCH_LIBS = "baseline";
    process.env.BENCH_MAX_ITERATIONS = "10";

    vi.resetModules();
    const logSpy = vi.spyOn(console, "log");
    const { main: runMain } = await import("./bench.js");

    await runMain();

    expect(logSpy.mock.calls.some((call) => String(call[0]).includes("WARNING"))).toBe(true);
  });
});
