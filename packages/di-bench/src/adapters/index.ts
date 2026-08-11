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

export function getAdapters(filter?: string): BenchAdapter[] {
  if (!filter || filter === "all") return ALL_ADAPTERS;
  const ids = filter.split(",").map((s) => s.trim());
  return ALL_ADAPTERS.filter((a) => ids.includes(a.id));
}
