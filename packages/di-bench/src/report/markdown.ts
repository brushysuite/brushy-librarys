import { DI_LIBS } from "../metrics/aggregate.js";
import type { BenchReport } from "../types.js";
import { ALL_LIB_IDS, ALL_SCENARIOS } from "../types.js";
import { formatHz, formatMs, formatPct, nsToMs, pad } from "./format.js";

export function renderMarkdown(report: BenchReport): string {
  const lines: string[] = [];

  lines.push("# DI Benchmark Report");
  lines.push("");

  const frameworkScenarios = [
    ...new Set(report.aggregated.filter((r) => DI_LIBS.includes(r.lib)).map((r) => r.scenario)),
  ];

  const brushyTop1 = report.aggregated.filter(
    (r) => r.lib === "brushy" && r.frameworkIsTop1,
  ).length;
  const brushyTied = report.aggregated.filter(
    (r) => r.lib === "brushy" && r.frameworkIsTied,
  ).length;
  const totalFrameworkScenarios = frameworkScenarios.length;

  const behind5pct = report.aggregated.filter(
    (r) =>
      r.lib === "brushy" &&
      r.frameworkRank !== undefined &&
      r.frameworkRank > 1 &&
      r.frameworkGapToSecondPct !== undefined &&
      Math.abs(r.frameworkGapToSecondPct) > 5,
  );

  lines.push("## Summary");
  lines.push("");
  if (report.meta.isPartialRun) {
    lines.push(`- **Partial run** - scenarios: ${report.meta.scenariosRun.join(", ")}`);
    lines.push("- Full-suite `latest.*` is only updated when all scenarios run.");
    lines.push("");
  }
  lines.push(
    `- **@brushy/di** is #1 among DI runtimes in **${brushyTop1}/${totalFrameworkScenarios}** scenarios (${totalFrameworkScenarios > 0 ? ((brushyTop1 / totalFrameworkScenarios) * 100).toFixed(0) : 0}%).`,
  );
  if (brushyTied > 0) {
    lines.push(
      `- Statistical ties (within ${report.meta.tieMarginPct}%): ${brushyTied} scenario(s).`,
    );
  }
  lines.push(
    `- Scenarios where @brushy/di is >5% behind #2: ${behind5pct.length > 0 ? behind5pct.map((r) => r.scenario).join(", ") : "none"}.`,
  );
  lines.push(
    "- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.",
  );
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

  lines.push("## DI Framework Ranking by Scenario");
  lines.push("");
  for (const scenario of ALL_SCENARIOS) {
    const rows = report.aggregated
      .filter((r) => r.scenario === scenario && !r.error && DI_LIBS.includes(r.lib))
      .sort((a, b) => (a.frameworkRank ?? 99) - (b.frameworkRank ?? 99));
    if (rows.length === 0) {
      if (!report.meta.scenariosRun.includes(scenario)) continue;
      lines.push(`### ${scenario}`);
      lines.push("");
      lines.push("No data.");
      lines.push("");
      continue;
    }
    lines.push(`### ${scenario}`);
    lines.push("");
    for (const row of rows) {
      const top1Marker = row.frameworkIsTop1 ? " 🥇" : "";
      const tieMarker = row.frameworkIsTied ? " (tie)" : "";
      const gapText =
        row.frameworkIsTop1 && row.frameworkGapToSecondPct !== undefined
          ? ` (+${row.frameworkGapToSecondPct.toFixed(1)}% vs #2)`
          : "";
      lines.push(
        `${row.frameworkRank}. **${row.libLabel}**${top1Marker}${tieMarker} - ${formatHz(row.throughputP50)} (p99 ${formatMs(row.latencyP99Ns)})${gapText}`,
      );
    }
    lines.push("");
  }

  lines.push("## Overhead vs Baseline");
  lines.push("");
  lines.push(buildOverheadTable(report));
  lines.push("");

  lines.push("## Brushy vs competitors");
  lines.push("");
  lines.push(buildBrushyCompareTable(report));
  lines.push("");

  lines.push("## Detailed Metrics");
  lines.push("");
  for (const scenario of ALL_SCENARIOS) {
    if (!report.meta.scenariosRun.includes(scenario)) continue;
    lines.push(`### ${scenario}`);
    lines.push("");
    lines.push("| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |");
    lines.push("|-----|---------|--------|--------|--------|-----|-----|---------|");
    for (const lib of ALL_LIB_IDS) {
      const row = report.aggregated.find((r) => r.scenario === scenario && r.lib === lib);
      if (!row) continue;
      if (row.error) {
        lines.push(`| ${row.libLabel} | ERROR | - | - | - | - | - | - |`);
        continue;
      }
      lines.push(
        `| ${row.libLabel} | ${formatHz(row.throughputMean)} | ${formatHz(row.throughputP50)} | ${nsToMs(row.latencyP50Ns).toFixed(4)} | ${nsToMs(row.latencyP99Ns).toFixed(4)} | ±${row.latencyRme.toFixed(2)}% | ${row.throughputCvPct?.toFixed(1) ?? "-"} | ${row.samplesCount} |`,
      );
    }
    lines.push("");
  }

  lines.push("## Notes");
  lines.push("");
  lines.push("- `request_scope`: tsyringe and inversify have no native request scope (N/A).");
  lines.push("- Baseline measures direct `new` / property access without a container.");
  lines.push("- DI ranking excludes baseline; ties declared within configured margin.");
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
  const header = `| Scenario | ${libLabels.map((l) => l.replace("@brushy/", "")).join(" | ")} |`;
  const sep = `|----------|${libLabels.map(() => "----------").join("|")}|`;

  const rows = report.meta.scenariosRun.map((scenario) => {
    const cells = ALL_LIB_IDS.map((lib) => {
      const row = report.aggregated.find((r) => r.scenario === scenario && r.lib === lib);
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
  const header = `| Scenario | ${libs.join(" vs baseline | ")} |`;
  const sep = `|----------|${libs.map(() => "----------------").join("|")}|`;

  const rows = report.meta.scenariosRun.map((scenario) => {
    const cells = libs.map((lib) => {
      const row = report.aggregated.find((r) => r.scenario === scenario && r.lib === lib);
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

  const rows = report.meta.scenariosRun.map((scenario) => {
    const cells = libs.map((lib) => {
      const row = report.aggregated.find((r) => r.scenario === scenario && r.lib === lib);
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
  const header = pad("Scenario", 18) + ALL_LIB_IDS.map((id) => pad(id, colWidth)).join("");
  lines.push(header);
  lines.push("-".repeat(header.length));

  for (const scenario of report.meta.scenariosRun) {
    let line = pad(scenario, 18);
    for (const lib of ALL_LIB_IDS) {
      const row = report.aggregated.find((r) => r.scenario === scenario && r.lib === lib);
      if (!row || row.error) {
        line += pad("N/A", colWidth);
      } else {
        const isDiTop = DI_LIBS.includes(lib) && row.frameworkIsTop1 ? "*" : "";
        line += pad(formatHz(row.throughputP50) + isDiTop, colWidth);
      }
    }
    lines.push(line);
  }

  const brushyTop1 = report.aggregated.filter(
    (r) => r.lib === "brushy" && r.frameworkIsTop1,
  ).length;
  const totalFrameworkScenarios = report.aggregated.filter(
    (r) => r.lib === "brushy" && !r.error,
  ).length;

  lines.push("");
  if (report.meta.isPartialRun) {
    lines.push("PARTIAL RUN - latest.* not updated unless this was the first run.");
  }
  lines.push(`@brushy/di #1 among DI libs in ${brushyTop1}/${totalFrameworkScenarios} scenarios.`);
  lines.push("* marks DI framework #1 per scenario (baseline excluded).");
  lines.push(`Results written to packages/di-bench/results/ (BENCHMARK.md, latest.*)`);
  lines.push("");

  return lines.join("\n");
}

export { buildBrushyCompareTable, buildOverheadTable, buildThroughputTable };
