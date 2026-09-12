# @brushy/di-bench

Tier 1 comparative benchmarks: `@brushy/di-core` vs **tsyringe**, **InversifyJS**, **awilix**, and a direct-`new` baseline.

Private package (not published to npm). Used by CI and for local performance regression checks.

## Scenarios

| ID | Description |
| --- | --- |
| `singleton_cold` | Register + first resolve (fresh container per iteration) |
| `singleton_warm` | Repeated resolve with a warm singleton cache |
| `transient` | New instance on every resolve |
| `deep_graph` | Linear chain A→B→C→D→E (5 levels) |
| `wide_graph` | Hub service with 5 parallel dependencies |
| `factory_deps` | Factory provider with 2 injected dependencies |
| `register_batch` | Register 50 providers one by one |
| `request_scope` | Scoped resolve per iteration (brushy + awilix only) |

## Metrics

Collected via [tinybench](https://github.com/tinylibs/tinybench) with `hrtimeNow`:

- Throughput mean / p50 (ops/s)
- Latency p50, p75, p99 (ms)
- Standard deviation, relative margin of error (rme)
- Derived: overhead vs baseline, diff vs brushy, per-scenario ranking

## How to run

From the repository root:

```bash
# Build di-core first
npm run build -w @brushy/di-core

# Full suite (~5 runs × 3s per task) and update published results
npm run bench:report

# Smoke test (1 run, 1s)
npm run bench:quick
```

From this package directory:

```bash
npm run build -w @brushy/di-core
npm run bench
npm run bench:quick
```

## Environment variables

| Env | Default | Description |
| --- | --- | --- |
| `BENCH_TIME_MS` | `3000` | Duration of each task |
| `BENCH_RUNS` | `5` | Full suite runs |
| `BENCH_SCENARIOS` | `all` | Filter, e.g. `singleton_warm,transient` |
| `BENCH_LIBS` | `all` | Filter, e.g. `brushy,tsyringe` |
| `BENCH_HISTORY` | `0` | Save snapshot under `results/history/` |

## Published results

Official numbers are versioned under `results/` and refreshed by the [Benchmark workflow](../../.github/workflows/benchmark.yml) on push to `main` (when `di-core` or `di-bench` change) and weekly.

| File | Description |
| --- | --- |
| [`results/BENCHMARK.md`](results/BENCHMARK.md) | Human-readable report (copy of `latest.md`) |
| [`results/latest.md`](results/latest.md) | Comparative report |
| [`results/latest.json`](results/latest.json) | Aggregated raw data |
| [`results/latest.csv`](results/latest.csv) | Spreadsheet export |

Main CI runs only `bench:quick` as a smoke test. The full suite and result commits use the dedicated benchmark workflow.

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Run on an idle machine with Node 20+ for stable numbers.
- Results are indicative; profile your own app for production decisions.

## Related

- [Methodology](./METHODOLOGY.md)
- [Docs: Benchmarks](https://brushysuite.gfrancodev.com/docs/di/benchmarks)
- [@brushy/di README](../di/README.md#benchmark)
