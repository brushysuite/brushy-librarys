import "reflect-metadata";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Bench, type TaskResult } from "tinybench";
import { getAdapters } from "./adapters/index.js";
import { captureEnvironment } from "./env.js";
import { buildReport } from "./metrics/aggregate.js";
import { renderConsoleSummary } from "./report/markdown.js";
import { writeReportArtifacts } from "./report/write.js";
import {
  ALL_SCENARIOS,
  type BenchAdapter,
  type ScenarioId,
  type TaskMetrics,
} from "./types.js";

const TIME_MS = Number(process.env.BENCH_TIME_MS ?? 3000);
const RUNS = Number(process.env.BENCH_RUNS ?? 5);
const SCENARIOS_FILTER = process.env.BENCH_SCENARIOS ?? "all";
const LIBS_FILTER = process.env.BENCH_LIBS ?? "all";

function parseScenarios(): ScenarioId[] {
  if (SCENARIOS_FILTER === "all") return ALL_SCENARIOS;
  return SCENARIOS_FILTER.split(",").map((s) => s.trim()) as ScenarioId[];
}

function medianMs(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted[mid];
}

function msToNs(ms: number): number {
  return ms * 1_000_000;
}

function hzFromPeriodMs(ms: number): number {
  return ms > 0 ? 1000 / ms : 0;
}

function extractMetrics(
  taskName: string,
  result: TaskResult,
  runIndex: number,
): TaskMetrics {
  const [lib, scenario] = taskName.split("::") as [TaskMetrics["lib"], ScenarioId];
  const adapter = getAdapters().find((a) => a.id === lib);

  if (result.error) {
    return {
      lib,
      libLabel: adapter?.label ?? lib,
      scenario,
      runIndex,
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
      error: String(result.error),
    };
  }

  const p50Ms = medianMs(result.samples);
  const throughputP50 = hzFromPeriodMs(p50Ms);

  return {
    lib,
    libLabel: adapter?.label ?? lib,
    scenario,
    runIndex,
    throughputMean: result.hz,
    throughputP50,
    latencyMeanNs: msToNs(result.mean),
    latencyP50Ns: msToNs(p50Ms),
    latencyP75Ns: msToNs(result.p75),
    latencyP99Ns: msToNs(result.p99),
    latencyMinNs: msToNs(result.min),
    latencyMaxNs: msToNs(result.max),
    latencySdNs: msToNs(result.sd),
    latencyMoeNs: msToNs(result.moe),
    latencyRme: result.rme,
    samplesCount: result.samples.length,
  };
}

async function runSuite(
  adapters: BenchAdapter[],
  scenarios: ScenarioId[],
  runIndex: number,
): Promise<TaskMetrics[]> {
  const bench = new Bench({
    time: TIME_MS,
    warmupTime: 500,
    warmupIterations: 1000,
    iterations: 0,
  });

  for (const adapter of adapters) {
    for (const scenario of scenarios) {
      if (!adapter.supports(scenario)) continue;

      const scenarioRunner = adapter.createScenario(scenario);
      const taskName = `${adapter.id}::${scenario}`;

      bench.add(
        taskName,
        () => {
          scenarioRunner.run();
        },
        {
          beforeAll: () => scenarioRunner.setup(),
          afterAll: () => scenarioRunner.teardown(),
        },
      );
    }
  }

  await bench.warmup();
  await bench.run();

  const metrics: TaskMetrics[] = [];
  for (const task of bench.tasks) {
    if (!task.result) continue;
    metrics.push(extractMetrics(task.name ?? "", task.result, runIndex));
  }

  return metrics;
}

async function main(): Promise<void> {
  const scenarios = parseScenarios();
  const adapters = getAdapters(LIBS_FILTER);

  const environment = captureEnvironment(
    TIME_MS,
    RUNS,
    SCENARIOS_FILTER,
    LIBS_FILTER,
  );

  console.log("DI Benchmark — Tier 1");
  console.log(
    `Node ${environment.node} | ${environment.platform} | runs=${RUNS} time=${TIME_MS}ms`,
  );
  console.log(`Libs: ${adapters.map((a) => a.id).join(", ")}`);
  console.log(`Scenarios: ${scenarios.join(", ")}`);

  const allTasks: TaskMetrics[] = [];

  for (let run = 0; run < RUNS; run++) {
    console.log(`\nRun ${run + 1}/${RUNS}...`);
    const tasks = await runSuite(adapters, scenarios, run);
    allTasks.push(...tasks);
  }

  const report = buildReport(environment, RUNS, allTasks);

  const resultsDir = join(
    dirname(fileURLToPath(import.meta.url)),
    "..",
    "results",
  );
  await mkdir(resultsDir, { recursive: true });

  await writeReportArtifacts(report);
  console.log(renderConsoleSummary(report));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
