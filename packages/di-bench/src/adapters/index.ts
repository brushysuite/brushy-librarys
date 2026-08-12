import { brushyAdapter } from "./brushy.js";
import { tsyringeAdapter } from "./tsyringe.js";
import { inversifyAdapter } from "./inversify.js";
import { awilixAdapter } from "./awilix.js";
import { baselineAdapter } from "./baseline.js";
import type { BenchAdapter } from "../types.js";

export const ALL_ADAPTERS: BenchAdapter[] = [
  brushyAdapter,
  tsyringeAdapter,
  inversifyAdapter,
  awilixAdapter,
  baselineAdapter,
];

function mulberry32(seed: number): () => number {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffleAdapters(
  adapters: BenchAdapter[],
  seed = 42,
): BenchAdapter[] {
  const random = mulberry32(seed);
  const copy = [...adapters];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function getAdapters(filter?: string, seed = 42): BenchAdapter[] {
  const base =
    !filter || filter === "all"
      ? ALL_ADAPTERS
      : ALL_ADAPTERS.filter((a) =>
          filter.split(",").map((s) => s.trim()).includes(a.id),
        );

  return shuffleAdapters(base, seed);
}
