import type {
  AggregatedTaskMetrics,
  BenchReport,
  BenchReportMeta,
  LibId,
  ScenarioId,
  TaskMetrics,
} from "../types.js";
import { ALL_SCENARIOS } from "../types.js";

const DI_LIBS: LibId[] = ["brushy", "tsyringe", "inversify", "awilix"];
const TIE_MARGIN_PCT = Number(process.env.BENCH_TIE_MARGIN_PCT ?? 2);

function groupKey(lib: LibId, scenario: ScenarioId): string {
  return `${lib}:${scenario}`;
}

export function aggregateMetrics(
  tasks: TaskMetrics[],
  runs: number,
  scenariosRun: ScenarioId[],
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
    const first = group[0]!;
    const valid = group.filter((t) => !t.error && t.samplesCount > 0);
    if (valid.length === 0) {
      aggregated.push({ ...first, error: first.error ?? "no valid samples" });
      continue;
    }

    const p50Values = valid.map((t) => t.throughputP50);
    const meanP50 = p50Values.reduce((a, b) => a + b, 0) / p50Values.length;
    const sdP50 =
      valid.length > 1
        ? Math.sqrt(
            p50Values.reduce((sum, v) => sum + (v - meanP50) ** 2, 0) /
              (valid.length - 1),
          )
        : 0;
    const cvPct = meanP50 > 0 ? (sdP50 / meanP50) * 100 : 0;
    const medianRun = [...valid].sort((a, b) => a.throughputP50 - b.throughputP50)[
      Math.floor(valid.length / 2)
    ]!;

    aggregated.push({
      ...medianRun,
      throughputP50Mean: meanP50,
      throughputP50Sd: sdP50,
      throughputCvPct: cvPct,
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
    if (baseline && !row.error && row.lib !== "baseline") {
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

  for (const scenario of scenariosRun) {
    const rows = aggregated
      .filter((r) => r.scenario === scenario && !r.error && DI_LIBS.includes(r.lib))
      .sort((a, b) => b.throughputP50 - a.throughputP50);

    rows.forEach((row, index) => {
      row.frameworkRank = index + 1;
      row.frameworkIsTop1 = index === 0;
      row.rank = index + 1;
      row.isTop1 = index === 0;
    });

    if (rows.length >= 2) {
      const first = rows[0]!;
      const second = rows[1]!;
      const gap =
        ((first.throughputP50 - second.throughputP50) / second.throughputP50) * 100;
      const tied = Math.abs(gap) <= TIE_MARGIN_PCT;

      for (const row of rows) {
        row.frameworkGapToSecondPct = gap;
        row.gapToSecondPct = gap;
        if (tied && row.frameworkRank !== undefined && row.frameworkRank <= 2) {
          row.frameworkIsTied = true;
        }
      }
    }
  }

  return aggregated;
}

export function buildReportMeta(scenariosRun: ScenarioId[]): BenchReportMeta {
  const unique = [...new Set(scenariosRun)];
  const allScenariosExpected =
    unique.length === ALL_SCENARIOS.length &&
    ALL_SCENARIOS.every((s) => unique.includes(s));

  return {
    isPartialRun: !allScenariosExpected,
    scenariosRun: unique,
    allScenariosExpected,
    tieMarginPct: TIE_MARGIN_PCT,
  };
}

export function buildReport(
  environment: BenchReport["environment"],
  runs: number,
  tasks: TaskMetrics[],
  scenariosRun: ScenarioId[],
): BenchReport {
  return {
    environment,
    runs,
    meta: buildReportMeta(scenariosRun),
    tasks,
    aggregated: aggregateMetrics(tasks, runs, scenariosRun),
  };
}

export { TIE_MARGIN_PCT, DI_LIBS };
