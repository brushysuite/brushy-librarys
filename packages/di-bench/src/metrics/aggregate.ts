import type {
  AggregatedTaskMetrics,
  BenchReport,
  LibId,
  ScenarioId,
  TaskMetrics,
} from "../types.js";

function groupKey(lib: LibId, scenario: ScenarioId): string {
  return `${lib}:${scenario}`;
}

export function aggregateMetrics(
  tasks: TaskMetrics[],
  runs: number,
): AggregatedTaskMetrics[] {
  const groups = new Map<string, TaskMetrics[]>();

  for (const task of tasks) {
    const key = groupKey(task.lib, task.scenario);
    const list = groups.get(key) ?? [];
    list.push(task);
    groups.set(key, list);
  }

  const aggregated: AggregatedTaskMetrics[] = [];

  for (const [, group] of groups) {
    const first = group[0];
    const valid = group.filter((t) => !t.error && t.samplesCount > 0);
    if (valid.length === 0) {
      aggregated.push({ ...first, error: first.error ?? "no valid samples" });
      continue;
    }

    const p50Values = valid.map((t) => t.throughputP50);
    const meanP50 =
      p50Values.reduce((a, b) => a + b, 0) / p50Values.length;
    const sdP50 =
      valid.length > 1
        ? Math.sqrt(
            p50Values.reduce((sum, v) => sum + (v - meanP50) ** 2, 0) /
              (p50Values.length - 1),
          )
        : 0;

  const best = valid.reduce((a, b) =>
    a.throughputP50 > b.throughputP50 ? a : b,
  );

    aggregated.push({
      ...best,
      throughputP50Mean: meanP50,
      throughputP50Sd: sdP50,
      runIndex: runs,
    });
  }

  const baselineByScenario = new Map<ScenarioId, AggregatedTaskMetrics>();
  for (const row of aggregated) {
    if (row.lib === "baseline" && !row.error) {
      baselineByScenario.set(row.scenario, row);
    }
  }

  const brushyByScenario = new Map<ScenarioId, AggregatedTaskMetrics>();
  for (const row of aggregated) {
    if (row.lib === "brushy" && !row.error) {
      brushyByScenario.set(row.scenario, row);
    }
  }

  for (const row of aggregated) {
    const baseline = baselineByScenario.get(row.scenario);
    if (baseline && !row.error) {
      const baselinePeriod = 1e9 / baseline.throughputP50;
      const libPeriod = 1e9 / row.throughputP50;
      row.vsBaselinePct = ((libPeriod - baselinePeriod) / baselinePeriod) * 100;
      row.speedupVsBaseline = baseline.throughputP50 / row.throughputP50;
    }

    const brushy = brushyByScenario.get(row.scenario);
    if (brushy && row.lib !== "brushy" && !row.error && brushy.throughputP50 > 0) {
      row.vsBrushyPct =
        ((row.throughputP50 - brushy.throughputP50) / brushy.throughputP50) * 100;
    }
  }

  const scenarios = [...new Set(aggregated.map((a) => a.scenario))];
  for (const scenario of scenarios) {
    const rows = aggregated
      .filter((r) => r.scenario === scenario && !r.error)
      .sort((a, b) => b.throughputP50 - a.throughputP50);
    rows.forEach((row, index) => {
      row.rank = index + 1;
    });
  }

  return aggregated;
}

export function buildReport(
  environment: BenchReport["environment"],
  runs: number,
  tasks: TaskMetrics[],
): BenchReport {
  return {
    environment,
    runs,
    tasks,
    aggregated: aggregateMetrics(tasks, runs),
  };
}
