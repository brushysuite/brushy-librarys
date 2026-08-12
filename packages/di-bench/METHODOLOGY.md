# DI Benchmark Methodology

This package compares `@brushy/di-core` against common TypeScript DI libraries using [tinybench](https://github.com/tinylibs/tinybench).

## Scenarios

| Scenario | What it measures | Lifecycle |
| --- | --- | --- |
| `singleton_cold` | First resolve / instantiation | singleton |
| `singleton_warm` | Cached singleton resolve (10k warm-up) | singleton |
| `transient` | New instance per resolve | transient |
| `deep_graph` | Linear dependency chain (5 levels) | singleton |
| `wide_graph` | Hub with multiple dependencies | singleton |
| `factory_deps` | Factory with injected dependencies | singleton |
| `register_batch` | Individual registration of 50 providers | n/a |
| `request_scope` | Scoped resolve + dispose (Brushy/Awilix only) | scoped |

## Fairness rules

1. **Equal lifecycle** - graph and factory scenarios use explicit singleton scope in all libraries.
2. **Equal registration** - `register_batch` registers providers one-by-one (no Brushy-only `registerMany`).
3. **Comparable baselines** - graph scenarios rebuild the object graph each iteration.
4. **Result consumption** - every iteration folds a checksum to prevent dead-code elimination.
5. **Symmetric teardown** - Awilix scopes are disposed; Brushy uses `createScope().dispose()`.
6. **Scenario-first ordering** - tasks interleave by scenario, then library.
7. **Shuffled adapter order** - order is shuffled per run (`BENCH_ADAPTER_SEED`, default `42`).
8. **DI ranking separate from baseline** - direct `new` is overhead reference only.
9. **Partial runs** - filtered runs write `partial-<timestamp>.*` and do not overwrite full `latest.*`.
10. **Fresh di-core build** - `bench` rebuilds `@brushy/di-core` before measuring.
11. **Warm factory** - `factory_deps` warms 10k resolves like `singleton_warm`, and consumes the resolved instance (not a nested property) so the suite measures resolve cost.
12. **Awilix CLASSIC factories** - factory registrations use positional parameters (CLASSIC), not PROXY-style object destructuring.

## Running

```bash
# Full benchmark (3s × 5 runs per task)
npm run bench --workspace=@brushy/di-bench

# CI smoke (1s × 1 run)
npm run bench:quick --workspace=@brushy/di-bench
```

## Environment variables

| Variable | Default | Description |
| --- | --- | --- |
| `BENCH_TIME_MS` | `3000` | Duration per task |
| `BENCH_RUNS` | `5` | Number of full suite runs |
| `BENCH_SCENARIOS` | `all` | Comma-separated scenario filter |
| `BENCH_LIBS` | `all` | Comma-separated library filter |
| `BENCH_ADAPTER_SEED` | `42` | Shuffle seed for adapter order |
| `BENCH_TIE_MARGIN_PCT` | `2` | Statistical tie margin for DI ranking |
| `BENCH_BATCH_SIZE` | `1` | Operations per benchmark iteration |
| `BENCH_GC` | `0` | Call `global.gc()` between tasks (requires `--expose-gc`) |
| `BENCH_MAX_ITERATIONS` | `1000000` | Tinybench max iterations cap |
| `BENCH_HISTORY` | `0` | Save timestamped JSON to `results/history/` |

## Limitations

- Decorator-based libraries (tsyringe, inversify) include `reflect-metadata` overhead.
- `request_scope` semantics differ slightly between Brushy and Awilix.
- Results are **not** a substitute for profiling in your own application.
