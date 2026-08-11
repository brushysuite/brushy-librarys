import os from "node:os";
import type { BenchEnvironment } from "./types.js";

export function captureEnvironment(
  timeMs: number,
  runs: number,
  scenarios: string,
  libs: string,
): BenchEnvironment {
  const cpus = os.cpus();
  return {
    node: process.version,
    platform: process.platform,
    arch: process.arch,
    cpuCount: cpus.length,
    cpuModel: cpus[0]?.model ?? "unknown",
    date: new Date().toISOString(),
    benchConfig: {
      timeMs,
      runs,
      scenarios,
      libs,
    },
  };
}
