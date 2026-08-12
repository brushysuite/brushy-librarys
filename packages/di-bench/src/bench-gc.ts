export function maybeGcBetweenTasks(): void {
  if (process.env.BENCH_GC !== "1") return;
  const gc = (globalThis as { gc?: () => void }).gc;
  gc?.();
}
