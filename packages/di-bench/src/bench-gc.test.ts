import { afterEach, describe, expect, it, vi } from "vitest";
import { maybeGcBetweenTasks } from "./bench-gc.js";

describe("maybeGcBetweenTasks", () => {
  afterEach(() => {
    delete process.env.BENCH_GC;
    delete (globalThis as { gc?: () => void }).gc;
  });

  it("does nothing unless BENCH_GC is enabled", () => {
    const gc = vi.fn();
    (globalThis as { gc?: () => void }).gc = gc;

    maybeGcBetweenTasks();
    expect(gc).not.toHaveBeenCalled();

    process.env.BENCH_GC = "1";
    maybeGcBetweenTasks();
    expect(gc).toHaveBeenCalledTimes(1);
  });

  it("ignores missing global gc hook", () => {
    process.env.BENCH_GC = "1";
    expect(() => maybeGcBetweenTasks()).not.toThrow();
  });
});
