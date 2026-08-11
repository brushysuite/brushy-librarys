import type { BenchReport } from "../types.js";
import { ALL_LIB_IDS, ALL_SCENARIOS } from "../types.js";
import { formatHz, formatMs, formatPct, nsToMs, pad } from "./format.js";

export function renderMarkdown(report: BenchReport): string {
  const lines: string[] = [];

  lines.push("# DI Benchmark Report — Tier 1");
  lines.push("");
  lines.push("## Environment");
  lines.push("");
  lines.push(`- **Date:** ${report.environment.date}`);
  lines.push(`- **Node:** ${report.environment.node}`);
  lines.push(`- **Platform:** ${report.environment.platform} (${report.environment.arch})`);
  lines.push(`- **CPUs:** ${report.environment.cpuCount} × ${report.environment.cpuModel}`);
  lines.push(`- **Config:** time=${report.environment.benchConfig.timeMs}ms, runs=${report.runs}`);
  lines.push("");

  lines.push("## Executive Summary (throughput p50)");
  lines.push("");
  lines.push(buildThroughputTable(report, "throughputP50"));
  lines.push("");

  lines.push("## Ranking by Scenario");
  lines.push("");
  for (const scenario of ALL_SCENARIOS) {
    const rows = report.aggregated
      .filter((r) => r.scenario === scenario && !r.error)
      .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99));
    if (rows.length === 0) {
      lines.push(`### ${scenario}`);
      lines.push("");
      lines.push("No data.");
      lines.push("");
      continue;
    }
    lines.push(`### ${scenario}`);
    lines.push("");
    for (const row of rows) {
      lines.push(
        `${row.rank}. **${row.libLabel}** — ${formatHz(row.throughputP50)} (p99 ${formatMs(row.latencyP99Ns)})`,
      );
    }
    lines.push("");
  }

  lines.push("## Overhead vs Baseline");
  lines.push("");
  lines.push(buildOverheadTable(report));
  lines.push("");

  lines.push("## Brushy vs Tier 1");
  lines.push("");
  lines.push(buildBrushyCompareTable(report));
  lines.push("");

  lines.push("## Detailed Metrics");
  lines.push("");
  for (const scenario of ALL_SCENARIOS) {
    lines.push(`### ${scenario}`);
    lines.push("");
    lines.push("| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | samples |");
    lines.push("|-----|---------|--------|--------|--------|-----|---------|");
    for (const lib of ALL_LIB_IDS) {
      const row = report.aggregated.find(
        (r) => r.scenario === scenario && r.lib === lib,
      );
      if (!row) continue;
      if (row.error) {
        lines.push(`| ${row.libLabel} | ERROR | — | — | — | — | — |`);
        continue;
      }
      lines.push(
        `| ${row.libLabel} | ${formatHz(row.throughputMean)} | ${formatHz(row.throughputP50)} | ${nsToMs(row.latencyP50Ns).toFixed(4)} | ${nsToMs(row.latencyP99Ns).toFixed(4)} | ±${row.latencyRme.toFixed(2)}% | ${row.samplesCount} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Notes");
  lines.push("");
  lines.push("- `request_scope`: tsyringe and inversify have no native request scope (N/A).");
  lines.push("- Baseline measures direct `new` / property access without a container.");
  lines.push("- Results are indicative; run on an idle machine for stable numbers.");
  lines.push("");

  return lines.join("\n");
}

function buildThroughputTable(
  report: BenchReport,
  field: "throughputMean" | "throughputP50",
): string {
  const libLabels = ALL_LIB_IDS.map(
    (id) => report.aggregated.find((r) => r.lib === id)?.libLabel ?? id,
  );
  const header =
    "| Scenario | " + libLabels.map((l) => l.replace("@brushy/", "")).join(" | ") + " |";
  const sep =
    "|----------|" + libLabels.map(() => "----------").join("|") + "|";

  const rows = ALL_SCENARIOS.map((scenario) => {
    const cells = ALL_LIB_IDS.map((lib) => {
      const row = report.aggregated.find(
        (r) => r.scenario === scenario && r.lib === lib,
      );
      if (!row) return "N/A";
      if (row.error) return "ERR";
      if (field === "throughputP50") return formatHz(row.throughputP50);
      return formatHz(row.throughputMean);
    });
    return `| ${scenario} | ${cells.join(" | ")} |`;
  });

  return [header, sep, ...rows].join("\n");
}

function buildOverheadTable(report: BenchReport): string {
  const libs = ALL_LIB_IDS.filter((id) => id !== "baseline");
  const header = "| Scenario | " + libs.join(" vs baseline | ") + " |";
  const sep = "|----------|" + libs.map(() => "----------------").join("|") + "|";

  const rows = ALL_SCENARIOS.map((scenario) => {
    const cells = libs.map((lib) => {
      const row = report.aggregated.find(
        (r) => r.scenario === scenario && r.lib === lib,
      );
      return formatPct(row?.vsBaselinePct);
    });
    return `| ${scenario} | ${cells.join(" | ")} |`;
  });

  return [header, sep, ...rows].join("\n");
}

function buildBrushyCompareTable(report: BenchReport): string {
  const libs = ["tsyringe", "inversify", "awilix"] as const;
  const header = "| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |";
  const sep = "|----------|-------------------|---------------------|------------------|";

  const rows = ALL_SCENARIOS.map((scenario) => {
    const cells = libs.map((lib) => {
      const row = report.aggregated.find(
        (r) => r.scenario === scenario && r.lib === lib,
      );
      return formatPct(row?.vsBrushyPct);
    });
    return `| ${scenario} | ${cells.join(" | ")} |`;
  });

  return [header, sep, ...rows].join("\n");
}

export function renderConsoleSummary(report: BenchReport): string {
  const lines: string[] = [];
  lines.push("");
  lines.push("=== DI Benchmark Summary (throughput p50) ===");
  lines.push("");

  const colWidth = 12;
  const header =
    pad("Scenario", 18) +
    ALL_LIB_IDS.map((id) => pad(id, colWidth)).join("");
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const scenario of ALL_SCENARIOS) {
    let line = pad(scenario, 18);
    for (const lib of ALL_LIB_IDS) {
      const row = report.aggregated.find(
        (r) => r.scenario === scenario && r.lib === lib,
      );
      if (!row || row.error) {
        line += pad("N/A", colWidth);
      } else {
        line += pad(formatHz(row.throughputP50), colWidth);
      }
    }
    lines.push(line);
  }

  lines.push("");
  lines.push(`Results written to packages/di-bench/results/`);
  lines.push("");

  return lines.join("\n");
}
