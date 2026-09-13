import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchReport, ScenarioId } from "../types.js";
import { ALL_SCENARIOS } from "../types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESULTS_DIR = join(ROOT, "results");

export function isFullRun(scenariosRun: ScenarioId[]): boolean {
  return (
    scenariosRun.length === ALL_SCENARIOS.length &&
    ALL_SCENARIOS.every((s) => scenariosRun.includes(s))
  );
}

export async function writeReportArtifacts(
  report: BenchReport,
  scenariosRun: ScenarioId[],
): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });

  const fullRun = isFullRun(scenariosRun);
  const stamp = report.environment.date.replace(/[:.]/g, "-");

  const { renderMarkdown } = await import("./markdown.js");
  const { renderCsv } = await import("./csv.js");

  const json = JSON.stringify(report, null, 2);
  const md = renderMarkdown(report);
  const csv = renderCsv(report);

  if (fullRun) {
    await writeFile(join(RESULTS_DIR, "latest.json"), json, "utf8");
    await writeFile(join(RESULTS_DIR, "latest.md"), md, "utf8");
    await writeFile(join(RESULTS_DIR, "BENCHMARK.md"), md, "utf8");
    await writeFile(join(RESULTS_DIR, "latest.csv"), csv, "utf8");
  } else {
    const partialBase = `partial-${stamp}`;
    await writeFile(join(RESULTS_DIR, `${partialBase}.json`), json, "utf8");
    await writeFile(join(RESULTS_DIR, `${partialBase}.md`), md, "utf8");
    await writeFile(join(RESULTS_DIR, `${partialBase}.csv`), csv, "utf8");

    try {
      await readFile(join(RESULTS_DIR, "latest.json"));
      console.log(`Partial run saved as results/${partialBase}.* - latest.* unchanged.`);
    } catch {
      await writeFile(join(RESULTS_DIR, "latest.json"), json, "utf8");
      await writeFile(join(RESULTS_DIR, "latest.md"), md, "utf8");
      await writeFile(join(RESULTS_DIR, "BENCHMARK.md"), md, "utf8");
      await writeFile(join(RESULTS_DIR, "latest.csv"), csv, "utf8");
    }
  }

  if (process.env.BENCH_HISTORY === "1") {
    const historyDir = join(RESULTS_DIR, "history");
    await mkdir(historyDir, { recursive: true });
    const historyName = fullRun ? stamp : `partial-${stamp}`;
    await writeFile(join(historyDir, `${historyName}.json`), json, "utf8");
  }
}
