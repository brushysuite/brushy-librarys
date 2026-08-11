import type { BenchReport } from "../types.js";
import { nsToMs } from "./format.js";

export function renderCsv(report: BenchReport): string {
  const header = [
    "scenario",
    "lib",
    "throughput_mean",
    "throughput_p50",
    "latency_p50_ms",
    "latency_p99_ms",
    "latency_rme_pct",
    "vs_baseline_pct",
    "vs_brushy_pct",
    "rank",
    "samples",
    "error",
  ].join(",");

  const rows = report.aggregated.map((row) =>
    [
      row.scenario,
      row.lib,
      row.throughputMean.toFixed(2),
      row.throughputP50.toFixed(2),
      nsToMs(row.latencyP50Ns).toFixed(6),
      nsToMs(row.latencyP99Ns).toFixed(6),
      row.latencyRme.toFixed(4),
      row.vsBaselinePct?.toFixed(2) ?? "",
      row.vsBrushyPct?.toFixed(2) ?? "",
      row.rank ?? "",
      row.samplesCount,
      row.error ?? "",
    ].join(","),
  );

  return [header, ...rows].join("\n");
}
