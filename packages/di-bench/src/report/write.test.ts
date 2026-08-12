import { mkdtemp, readFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ALL_SCENARIOS } from "../types.js";
import { buildReport } from "../metrics/aggregate.js";
import { isFullRun, writeReportArtifacts } from "./write.js";

const sampleReport = (scenarios = ALL_SCENARIOS) =>
  buildReport(
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
    ],
    scenarios,
  );

describe("isFullRun", () => {
  it("is true only when every scenario ran", () => {
    expect(isFullRun(ALL_SCENARIOS)).toBe(true);
  });

  it("is false for a filtered scenario list", () => {
    expect(isFullRun(["request_scope"])).toBe(false);
    expect(isFullRun(ALL_SCENARIOS.slice(0, -1))).toBe(false);
  });
});

describe("writeReportArtifacts", () => {
  let tempRoot = "";
  let resultsDir = "";

  beforeEach(async () => {
    tempRoot = await mkdtemp(join(tmpdir(), "di-bench-write-"));
    resultsDir = join(tempRoot, "results");
    vi.resetModules();
    vi.doMock("node:url", async () => {
      const actual = await vi.importActual<typeof import("node:url")>("node:url");
      return {
        ...actual,
        fileURLToPath: () => join(tempRoot, "src/report/write.ts"),
      };
    });
  });

  afterEach(async () => {
    delete process.env.BENCH_HISTORY;
    await rm(tempRoot, { recursive: true, force: true });
    vi.doUnmock("node:url");
    vi.resetModules();
  });

  async function loadWriter() {
    return import("./write.js");
  }

  it("writes latest artifacts on full runs", async () => {
    const { writeReportArtifacts: write } = await loadWriter();
    await write(sampleReport(), ALL_SCENARIOS);

    await expect(readFile(join(resultsDir, "latest.json"), "utf8")).resolves.toContain(
      "brushy",
    );
    await expect(readFile(join(resultsDir, "latest.md"), "utf8")).resolves.toContain(
      "DI Benchmark Report",
    );
    await expect(readFile(join(resultsDir, "latest.csv"), "utf8")).resolves.toContain(
      "scenario,lib",
    );
  });

  it("writes partial artifacts without touching existing latest files", async () => {
    const { writeReportArtifacts: write } = await loadWriter();
    await write(sampleReport(), ALL_SCENARIOS);
    await write(sampleReport(["singleton_warm"]), ["singleton_warm"]);

    const latest = await readFile(join(resultsDir, "latest.json"), "utf8");
    expect(latest).toContain("singleton_warm");
    expect(latest).not.toContain('"scenario": "request_scope"');
  });

  it("seeds latest files when partial run happens before any full run", async () => {
    const { writeReportArtifacts: write } = await loadWriter();
    await write(sampleReport(["singleton_warm"]), ["singleton_warm"]);

    await expect(readFile(join(resultsDir, "latest.json"), "utf8")).resolves.toContain(
      "singleton_warm",
    );
  });

  it("stores history snapshots when enabled", async () => {
    process.env.BENCH_HISTORY = "1";
    const { writeReportArtifacts: write } = await loadWriter();
    await write(sampleReport(), ALL_SCENARIOS);

    const historyDir = join(resultsDir, "history");
    const files = await readFile(join(historyDir, "2026-01-01T00-00-00-000Z.json"), "utf8");
    expect(files).toContain("brushy");
  });

  it("stores partial history snapshots when enabled", async () => {
    process.env.BENCH_HISTORY = "1";
    const { writeReportArtifacts: write } = await loadWriter();
    await write(sampleReport(["singleton_warm"]), ["singleton_warm"]);

    const historyDir = join(resultsDir, "history");
    const files = await readFile(
      join(historyDir, "partial-2026-01-01T00-00-00-000Z.json"),
      "utf8",
    );
    expect(files).toContain("brushy");
  });
});
