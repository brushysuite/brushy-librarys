import "reflect-metadata";
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { Bench, type TaskResult } from "tinybench";
import { getAdapters, shuffleAdapters } from "./adapters/index.js";
import { maybeGcBetweenTasks } from "./bench-gc.js";
import { captureEnvironment } from "./env.js";
import { getGlobalChecksum, resetGlobalChecksum } from "./fixtures/checksum.js";
import { buildReport } from "./metrics/aggregate.js";
import { renderConsoleSummary } from "./report/markdown.js";
import { writeReportArtifacts } from "./report/write.js";
import { ALL_SCENARIOS, type BenchAdapter, type ScenarioId, type TaskMetrics } from "./types.js";

const TIME_MS = Number(process.env.BENCH_TIME_MS ?? 3000);
const RUNS = Number(process.env.BENCH_RUNS ?? 5);
const SCENARIOS_FILTER = process.env.BENCH_SCENARIOS ?? "all";
const LIBS_FILTER = process.env.BENCH_LIBS ?? "all";
/** Tinybench v6 treats `iterations` as a minimum sample count (runs until time AND min iterations). */
const MIN_ITERATIONS = Number(
  process.env.BENCH_MIN_ITERATIONS ?? process.env.BENCH_MAX_ITERATIONS ?? 64,
);
const BATCH_SIZE = Number(process.env.BENCH_BATCH_SIZE ?? 1);
const ADAPTER_SEED = Number(process.env.BENCH_ADAPTER_SEED ?? 42);

export function parseScenarios(filter: string = SCENARIOS_FILTER): ScenarioId[] {
  if (filter === "all") return ALL_SCENARIOS;
  return filter.split(",").map((s) => s.trim()) as ScenarioId[];
}

export function medianMs(samples: number[]): number {
  if (samples.length === 0) return 0;
  const sorted = [...samples].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)]!;
}

export function msToNs(ms: number): number {
  return ms * 1_000_000;
}

export function hzFromPeriodMs(ms: number): number {
  return ms > 0 ? 1000 / ms : 0;
}

function hasStatistics(
  result: TaskResult,
): result is Extract<TaskResult, { latency: unknown; throughput: unknown }> {
  return result.state === "completed" || result.state === "aborted-with-statistics";
}

export function extractMetrics(
  taskName: string,
  result: TaskResult,
  runIndex: number,
  adapters: BenchAdapter[],
): TaskMetrics {
  const [lib, scenario] = taskName.split("::") as [TaskMetrics["lib"], ScenarioId];
  const adapter = adapters.find((a) => a.id === lib);

  if (result.state === "errored") {
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

  if (!hasStatistics(result)) {
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
      error: `Task finished with state ${result.state}`,
    };
  }

  const { latency, throughput } = result;
  const throughputP50 = hzFromPeriodMs(latency.p50);

  return {
    lib,
    libLabel: adapter?.label ?? lib,
    scenario,
    runIndex,
    throughputMean: throughput.mean,
    throughputP50,
    latencyMeanNs: msToNs(latency.mean),
    latencyP50Ns: msToNs(latency.p50),
    latencyP75Ns: msToNs(latency.p75),
    latencyP99Ns: msToNs(latency.p99),
    latencyMinNs: msToNs(latency.min),
    latencyMaxNs: msToNs(latency.max),
    latencySdNs: msToNs(latency.sd),
    latencyMoeNs: msToNs(latency.moe),
    latencyRme: latency.rme,
    samplesCount: latency.samplesCount,
  };
}

let checksumSink = 0;

async function runScenarioBatch(
  adapters: BenchAdapter[],
  scenario: ScenarioId,
  runIndex: number,
): Promise<TaskMetrics[]> {
  const bench = new Bench({
    time: TIME_MS,
    warmup: true,
    warmupTime: 500,
    warmupIterations: 1000,
    iterations: MIN_ITERATIONS,
  });

  for (const adapter of adapters) {
    if (!adapter.supports(scenario)) continue;

    const scenarioRunner = adapter.createScenario(scenario);
    const taskName = `${adapter.id}::${scenario}`;

    bench.add(
      taskName,
      () => {
        if (BATCH_SIZE <= 1) {
          checksumSink += scenarioRunner.run();
          return;
        }
        for (let i = 0; i < BATCH_SIZE; i++) {
          checksumSink += scenarioRunner.run();
        }
      },
      {
        beforeAll: () => scenarioRunner.setup(),
        afterAll: () => {
          scenarioRunner.teardown();
          maybeGcBetweenTasks();
        },
      },
    );
  }

  await bench.run();

  const metrics: TaskMetrics[] = [];
  for (const task of bench.tasks) {
    if (!task.result) continue;
    metrics.push(extractMetrics(task.name ?? "", task.result, runIndex, adapters));
  }

  return metrics;
}

export async function runSuite(
  adapters: BenchAdapter[],
  scenarios: ScenarioId[],
  runIndex: number,
): Promise<TaskMetrics[]> {
  const metrics: TaskMetrics[] = [];

  for (const scenario of scenarios) {
    const startedAt = Date.now();
    console.log(`  Scenario ${scenario}...`);
    metrics.push(...(await runScenarioBatch(adapters, scenario, runIndex)));
    console.log(`  Scenario ${scenario} done (${Math.round((Date.now() - startedAt) / 1000)}s)`);
  }

  checksumSink += getGlobalChecksum();
  return metrics;
}

export async function main(): Promise<void> {
  const scenarios = parseScenarios();
  const baseAdapters = getAdapters(LIBS_FILTER, ADAPTER_SEED);

  const environment = captureEnvironment(TIME_MS, RUNS, SCENARIOS_FILTER, LIBS_FILTER);

  console.log("DI Benchmark - library comparison");
  console.log(
    `Node ${environment.node} | ${environment.platform} | runs=${RUNS} time=${TIME_MS}ms`,
  );
  console.log(`Libs: ${baseAdapters.map((a) => a.id).join(", ")}`);
  console.log(`Scenarios: ${scenarios.join(", ")}`);
  if (scenarios.length < ALL_SCENARIOS.length) {
    console.log(`WARNING: partial scenario run - results will not overwrite full latest.*`);
  }

  const allTasks: TaskMetrics[] = [];
  resetGlobalChecksum();

  for (let run = 0; run < RUNS; run++) {
    const runSeed = ADAPTER_SEED + run;
    const adapters = shuffleAdapters(baseAdapters, runSeed);
    console.log(`\nRun ${run + 1}/${RUNS} (adapter seed ${runSeed})...`);
    const tasks = await runSuite(adapters, scenarios, run);
    allTasks.push(...tasks);
    maybeGcBetweenTasks();
  }

  const report = buildReport(environment, RUNS, allTasks, scenarios);

  const resultsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "results");
  await mkdir(resultsDir, { recursive: true });

  await writeReportArtifacts(report, scenarios);
  console.log(renderConsoleSummary(report));

  if (checksumSink === 0 && allTasks.some((t) => !t.error)) {
    console.warn("Checksum sink is zero - results may have been eliminated.");
  }
}

/* v8 ignore start */
const entry = process.argv[1];
if (entry && import.meta.url === pathToFileURL(entry).href) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
/* v8 ignore stop */
