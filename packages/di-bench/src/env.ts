import { createRequire } from "node:module";
import os from "node:os";
import type { BenchEnvironment } from "./types.js";

const require = createRequire(import.meta.url);

function readPackageVersion(name: string): string {
  try {
    return require(`${name}/package.json`).version as string;
  } catch {
    return "unknown";
  }
}

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
    packageVersions: {
      brushy: readPackageVersion("@brushy/di-core"),
      awilix: readPackageVersion("awilix"),
      inversify: readPackageVersion("inversify"),
      tsyringe: readPackageVersion("tsyringe"),
      tinybench: readPackageVersion("tinybench"),
    },
  };
}
