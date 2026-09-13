import { describe, expect, it } from "vitest";
import type { AggregatedTaskMetrics, TaskMetrics } from "../types.js";
import { aggregateMetrics, buildReport, buildReportMeta, DI_LIBS } from "./aggregate.js";

function makeTask(
  lib: TaskMetrics["lib"],
  scenario: TaskMetrics["scenario"],
  throughputP50: number,
  runIndex = 0,
): TaskMetrics {
  return {
    lib,
    libLabel: lib,
    scenario,
    runIndex,
    throughputMean: throughputP50,
    throughputP50,
    latencyMeanNs: 0,
    latencyP50Ns: 0,
    latencyP75Ns: 0,
    latencyP99Ns: 0,
    latencyMinNs: 0,
    latencyMaxNs: 0,
    latencySdNs: 0,
    latencyMoeNs: 0,
    latencyRme: 0,
    samplesCount: 100,
  };
}

describe("aggregateMetrics", () => {
  it("ranks only DI libraries, excluding baseline", () => {
    const tasks = [
      makeTask("baseline", "singleton_warm", 10_000_000),
      makeTask("brushy", "singleton_warm", 5_000_000),
      makeTask("awilix", "singleton_warm", 4_000_000),
      makeTask("inversify", "singleton_warm", 3_000_000),
      makeTask("tsyringe", "singleton_warm", 2_000_000),
    ];

    const aggregated = aggregateMetrics(tasks, 1, ["singleton_warm"]);
    const brushy = aggregated.find((r: AggregatedTaskMetrics) => r.lib === "brushy")!;
    const baseline = aggregated.find((r: AggregatedTaskMetrics) => r.lib === "baseline")!;

    expect(brushy.frameworkRank).toBe(1);
    expect(brushy.frameworkIsTop1).toBe(true);
    expect(baseline.frameworkRank).toBeUndefined();
    expect(baseline.isTop1).toBeUndefined();
  });

  it("computes vsBaseline only for DI libs", () => {
    const tasks = [
      makeTask("baseline", "transient", 8_000_000),
      makeTask("brushy", "transient", 4_000_000),
    ];

    const aggregated = aggregateMetrics(tasks, 1, ["transient"]);
    const brushy = aggregated.find((r: AggregatedTaskMetrics) => r.lib === "brushy")!;
    const baseline = aggregated.find((r: AggregatedTaskMetrics) => r.lib === "baseline")!;

    expect(brushy.vsBaselinePct).toBeGreaterThan(0);
    expect(baseline.vsBaselinePct).toBeUndefined();
  });

  it("marks statistical ties within margin", () => {
    const tasks = [
      makeTask("brushy", "deep_graph", 1_000_000),
      makeTask("awilix", "deep_graph", 990_000),
      makeTask("inversify", "deep_graph", 500_000),
    ];

    const aggregated = aggregateMetrics(tasks, 1, ["deep_graph"]);
    const brushy = aggregated.find((r: AggregatedTaskMetrics) => r.lib === "brushy")!;
    const awilix = aggregated.find((r: AggregatedTaskMetrics) => r.lib === "awilix")!;

    expect(brushy.frameworkIsTop1).toBe(true);
    expect(brushy.frameworkIsTied).toBe(true);
    expect(awilix.frameworkIsTied).toBe(true);
  });
});

describe("buildReportMeta", () => {
  it("detects partial runs", () => {
    const meta = buildReportMeta(["request_scope"]);
    expect(meta.isPartialRun).toBe(true);
    expect(meta.allScenariosExpected).toBe(false);
  });

  it("detects full runs", () => {
    const meta = buildReportMeta([
      "singleton_cold",
      "singleton_warm",
      "transient",
      "deep_graph",
      "wide_graph",
      "factory_deps",
      "register_batch",
      "request_scope",
    ]);
    expect(meta.isPartialRun).toBe(false);
    expect(meta.allScenariosExpected).toBe(true);
  });
});

describe("buildReport", () => {
  it("includes meta and aggregated rows", () => {
    const report = buildReport(
      {
        node: "v22.0.0",
        platform: "linux",
        arch: "x64",
        cpuCount: 8,
        cpuModel: "test",
        date: "2026-01-01T00:00:00.000Z",
        benchConfig: { timeMs: 1000, runs: 1, scenarios: "all", libs: "all" },
      },
      1,
      [makeTask("brushy", "singleton_warm", 1_000_000)],
      ["singleton_warm"],
    );

    expect(report.meta.isPartialRun).toBe(true);
    expect(report.aggregated).toHaveLength(1);
    expect(DI_LIBS).toContain("brushy");
  });
});

describe("aggregate edge cases", () => {
  it("returns explicit errors when no valid samples exist", () => {
    const errored = makeTask("brushy", "transient", 0);
    errored.error = "bench failed";
    errored.samplesCount = 0;

    const aggregated = aggregateMetrics([errored], 1, ["transient"]);
    expect(aggregated[0]?.error).toBe("bench failed");
  });

  it("uses fallback error text and computes sd/cv for multi-run groups", () => {
    const first = makeTask("brushy", "deep_graph", 1_000_000, 0);
    first.samplesCount = 0;
    const second = makeTask("brushy", "deep_graph", 1_200_000, 1);
    second.samplesCount = 10;

    const noSamples = aggregateMetrics([first], 1, ["deep_graph"]);
    expect(noSamples[0]?.error).toBe("no valid samples");

    const multiRun = aggregateMetrics(
      [
        makeTask("brushy", "deep_graph", 1_000_000, 0),
        makeTask("brushy", "deep_graph", 1_200_000, 1),
      ],
      2,
      ["deep_graph"],
    );
    expect(multiRun[0]?.throughputP50Sd).toBeGreaterThan(0);
    expect(multiRun[0]?.throughputCvPct).toBeGreaterThan(0);
  });

  it("keeps cv at zero when mean throughput is zero", () => {
    const zero = makeTask("brushy", "factory_deps", 0);
    zero.throughputMean = 0;
    zero.throughputP50 = 0;

    const aggregated = aggregateMetrics([zero], 1, ["factory_deps"]);
    expect(aggregated[0]?.throughputCvPct).toBe(0);
  });
});
