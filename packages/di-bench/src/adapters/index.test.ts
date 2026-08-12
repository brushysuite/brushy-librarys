import { describe, expect, it } from "vitest";
import { ALL_ADAPTERS, getAdapters, shuffleAdapters } from "./index.js";

describe("adapter registry", () => {
  it("returns all adapters by default", () => {
    const adapters = getAdapters("all", 1);
    expect(adapters).toHaveLength(ALL_ADAPTERS.length);
  });

  it("filters adapters by id", () => {
    const adapters = getAdapters("brushy,baseline", 99);
    expect(adapters.map((adapter) => adapter.id).sort()).toEqual(["baseline", "brushy"]);
  });

  it("returns all adapters when filter is omitted", () => {
    expect(getAdapters(undefined, 1)).toHaveLength(ALL_ADAPTERS.length);
  });

  it("shuffles deterministically by seed", () => {
    const base = ALL_ADAPTERS.slice(0, 3);
    const first = shuffleAdapters(base, 7).map((adapter) => adapter.id);
    const second = shuffleAdapters(base, 7).map((adapter) => adapter.id);
    const third = shuffleAdapters(base, 8).map((adapter) => adapter.id);

    expect(first).toEqual(second);
    expect(first).not.toEqual(third);
  });
});
