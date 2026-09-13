import { describe, expect, it } from "vitest";
import { buildReport } from "../metrics/aggregate.js";
import { ALL_SCENARIOS } from "../types.js";
import { renderCsv } from "./csv.js";

function sampleReport(partial = false) {
  const scenariosRun = partial ? (["singleton_warm"] as const) : ALL_SCENARIOS;
  return buildReport(
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
        throughputMean: 4_000_000,
        throughputP50: 4_000_000,
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
        error: "boom",
      },
    ],
    [...scenariosRun],
  );
}

describe("renderCsv", () => {
  it("renders header and aggregated rows", () => {
    const report = sampleReport(true);
    const csv = renderCsv(report);
    const lines = csv.split("\n");

    expect(lines[0]).toContain("scenario,lib,throughput_mean");
    expect(lines.some((line) => line.startsWith("singleton_warm,baseline"))).toBe(true);
    expect(lines.some((line) => line.includes("boom"))).toBe(true);
  });

  it("renders empty optional csv fields and false framework flags", () => {
    const report = sampleReport(true);
    const row = report.aggregated.find((entry) => entry.lib === "brushy")!;
    row.frameworkIsTop1 = undefined;
    row.frameworkIsTied = undefined;
    row.frameworkGapToSecondPct = undefined;
    row.throughputCvPct = undefined;

    const csv = renderCsv(report);
    expect(csv).toContain(",0,0,");
  });

  it("renders true framework flags", () => {
    const report = sampleReport(true);
    const row = report.aggregated.find((entry) => entry.lib === "brushy")!;
    row.frameworkIsTop1 = true;
    row.frameworkIsTied = true;
    row.frameworkGapToSecondPct = 12.34;

    const csv = renderCsv(report);
    expect(csv).toContain(",1,1,");
    expect(csv).toContain("12.34");
  });
});
