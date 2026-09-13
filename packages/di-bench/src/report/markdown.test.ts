import { describe, expect, it } from "vitest";
import { buildReport } from "../metrics/aggregate.js";
import { ALL_SCENARIOS } from "../types.js";
import { buildThroughputTable, renderConsoleSummary, renderMarkdown } from "./markdown.js";

function sampleReport(options?: { partial?: boolean; tied?: boolean }) {
  const brushyHz = options?.tied ? 1_000_000 : 1_100_000;
  const awilixHz = 1_000_000;
  return buildReport(
    {
      node: "v22.0.0",
      platform: "linux",
      arch: "x64",
      cpuCount: 8,
      cpuModel: "test",
      date: "2026-01-01T00:00:00.000Z",
      benchConfig: { timeMs: 1000, runs: 2, scenarios: "all", libs: "all" },
    },
    2,
    [
      {
        lib: "baseline",
        libLabel: "baseline",
        scenario: "singleton_warm",
        runIndex: 0,
        throughputMean: 8_000_000,
        throughputP50: 8_000_000,
        latencyMeanNs: 100,
        latencyP50Ns: 100,
        latencyP75Ns: 110,
        latencyP99Ns: 150,
        latencyMinNs: 90,
        latencyMaxNs: 160,
        latencySdNs: 5,
        latencyMoeNs: 2,
        latencyRme: 1.2,
        samplesCount: 50,
      },
      {
        lib: "brushy",
        libLabel: "@brushy/di-core",
        scenario: "singleton_warm",
        runIndex: 0,
        throughputMean: brushyHz,
        throughputP50: brushyHz,
        latencyMeanNs: 200,
        latencyP50Ns: 200,
        latencyP75Ns: 220,
        latencyP99Ns: 300,
        latencyMinNs: 180,
        latencyMaxNs: 320,
        latencySdNs: 10,
        latencyMoeNs: 4,
        latencyRme: 2.5,
        samplesCount: 50,
      },
      {
        lib: "awilix",
        libLabel: "awilix",
        scenario: "singleton_warm",
        runIndex: 0,
        throughputMean: awilixHz,
        throughputP50: awilixHz,
        latencyMeanNs: 210,
        latencyP50Ns: 210,
        latencyP75Ns: 230,
        latencyP99Ns: 310,
        latencyMinNs: 190,
        latencyMaxNs: 330,
        latencySdNs: 11,
        latencyMoeNs: 5,
        latencyRme: 2.6,
        samplesCount: 50,
      },
      {
        lib: "inversify",
        libLabel: "inversify",
        scenario: "singleton_warm",
        runIndex: 0,
        throughputMean: 500_000,
        throughputP50: 500_000,
        latencyMeanNs: 400,
        latencyP50Ns: 400,
        latencyP75Ns: 420,
        latencyP99Ns: 500,
        latencyMinNs: 380,
        latencyMaxNs: 520,
        latencySdNs: 12,
        latencyMoeNs: 6,
        latencyRme: 3.1,
        samplesCount: 50,
      },
      {
        lib: "tsyringe",
        libLabel: "tsyringe",
        scenario: "singleton_warm",
        runIndex: 0,
        throughputMean: 400_000,
        throughputP50: 400_000,
        latencyMeanNs: 450,
        latencyP50Ns: 450,
        latencyP75Ns: 470,
        latencyP99Ns: 550,
        latencyMinNs: 430,
        latencyMaxNs: 570,
        latencySdNs: 13,
        latencyMoeNs: 7,
        latencyRme: 3.2,
        samplesCount: 50,
      },
    ],
    options?.partial ? ["singleton_warm"] : ALL_SCENARIOS,
  );
}

describe("renderMarkdown", () => {
  it("renders full and partial reports", () => {
    const full = renderMarkdown(sampleReport());
    expect(full).toContain("# DI Benchmark Report");
    expect(full).toContain("Executive Summary");
    expect(full).toContain("Detailed Metrics");

    const partial = renderMarkdown(sampleReport({ partial: true, tied: true }));
    expect(partial).toContain("Partial run");
    expect(partial).toContain("Statistical ties");
  });

  it("includes no-data scenario sections for missing runs", () => {
    const report = buildReport(
      {
        node: "v22.0.0",
        platform: "linux",
        arch: "x64",
        cpuCount: 8,
        cpuModel: "test",
        date: "2026-01-01T00:00:00.000Z",
        benchConfig: {
          timeMs: 1000,
          runs: 1,
          scenarios: "request_scope",
          libs: "all",
        },
      },
      1,
      [],
      ["request_scope"],
    );
    const md = renderMarkdown(report);
    expect(md).toContain("No data.");
  });
});

describe("renderConsoleSummary", () => {
  it("renders console table with partial marker", () => {
    const summary = renderConsoleSummary(sampleReport({ partial: true }));
    expect(summary).toContain("DI Benchmark Summary");
    expect(summary).toContain("PARTIAL RUN");
    expect(summary).toContain("singleton_warm");
  });
});

describe("markdown helpers", () => {
  it("renders mean throughput table rows and detailed error lines", () => {
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
      [
        {
          lib: "brushy",
          libLabel: "@brushy/di-core",
          scenario: "singleton_warm",
          runIndex: 0,
          throughputMean: 900_000,
          throughputP50: 900_000,
          latencyMeanNs: 100,
          latencyP50Ns: 100,
          latencyP75Ns: 110,
          latencyP99Ns: 150,
          latencyMinNs: 90,
          latencyMaxNs: 160,
          latencySdNs: 5,
          latencyMoeNs: 2,
          latencyRme: 1.2,
          samplesCount: 50,
        },
        {
          lib: "awilix",
          libLabel: "awilix",
          scenario: "singleton_warm",
          runIndex: 0,
          throughputMean: 1_000_000,
          throughputP50: 1_000_000,
          latencyMeanNs: 100,
          latencyP50Ns: 100,
          latencyP75Ns: 110,
          latencyP99Ns: 150,
          latencyMinNs: 90,
          latencyMaxNs: 160,
          latencySdNs: 5,
          latencyMoeNs: 2,
          latencyRme: 1.2,
          samplesCount: 50,
        },
        {
          lib: "inversify",
          libLabel: "inversify",
          scenario: "singleton_warm",
          runIndex: 0,
          throughputMean: 500_000,
          throughputP50: 500_000,
          latencyMeanNs: 100,
          latencyP50Ns: 100,
          latencyP75Ns: 110,
          latencyP99Ns: 150,
          latencyMinNs: 90,
          latencyMaxNs: 160,
          latencySdNs: 5,
          latencyMoeNs: 2,
          latencyRme: 1.2,
          samplesCount: 50,
        },
        {
          lib: "tsyringe",
          libLabel: "tsyringe",
          scenario: "singleton_warm",
          runIndex: 0,
          throughputMean: 400_000,
          throughputP50: 400_000,
          latencyMeanNs: 100,
          latencyP50Ns: 100,
          latencyP75Ns: 110,
          latencyP99Ns: 150,
          latencyMinNs: 90,
          latencyMaxNs: 160,
          latencySdNs: 5,
          latencyMoeNs: 2,
          latencyRme: 1.2,
          samplesCount: 50,
        },
        {
          lib: "baseline",
          libLabel: "baseline",
          scenario: "singleton_warm",
          runIndex: 0,
          throughputMean: 0,
          throughputP50: 0,
          latencyMeanNs: 0,
          latencyP50Ns: 0,
          latencyP75Ns: 0,
          latencyP99Ns: 0,
          latencyMinNs: 0,
          latencyMaxNs: 0,
          latencySdNs: 0,
          latencyMoeNs: 0,
          latencyRme: 0,
          samplesCount: 0,
          error: "failed",
        },
      ],
      ["singleton_warm"],
    );

    const meanTable = buildThroughputTable(report, "throughputMean");
    expect(meanTable).toContain("900.00K/s");

    const md = renderMarkdown(report);
    expect(md).toContain(">5% behind #2: singleton_warm");
    expect(md).toContain("| baseline | ERROR |");
  });

  it("handles missing ranking metadata and cv values in detailed tables", () => {
    const report = sampleReport({ partial: true });
    const ranked = report.aggregated.find((entry) => entry.lib === "awilix")!;
    ranked.frameworkRank = undefined;
    ranked.throughputCvPct = undefined;

    const md = renderMarkdown(report);
    expect(md).toContain("| awilix |");
    expect(md).toContain("| - |");
  });
});
