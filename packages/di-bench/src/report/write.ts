import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { BenchReport } from "../types.js";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const RESULTS_DIR = join(ROOT, "results");

export async function writeReportArtifacts(report: BenchReport): Promise<void> {
  await mkdir(RESULTS_DIR, { recursive: true });

  await writeFile(
    join(RESULTS_DIR, "latest.json"),
    JSON.stringify(report, null, 2),
    "utf8",
  );

  const { renderMarkdown } = await import("./markdown.js");
  const { renderCsv } = await import("./csv.js");

  await writeFile(join(RESULTS_DIR, "latest.md"), renderMarkdown(report), "utf8");
  await writeFile(join(RESULTS_DIR, "latest.csv"), renderCsv(report), "utf8");

  if (process.env.BENCH_HISTORY === "1") {
    const stamp = report.environment.date.replace(/[:.]/g, "-");
    const historyDir = join(RESULTS_DIR, "history");
    await mkdir(historyDir, { recursive: true });
    await writeFile(
      join(historyDir, `${stamp}.json`),
      JSON.stringify(report, null, 2),
      "utf8",
    );
  }
}
