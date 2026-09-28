# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-09-28T13:16:24.937Z
- **Node:** v22.23.2
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 9V74 80-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.02M/s | 1.56M/s | 107.58K/s | 183.22K/s | 5.88M/s |
| singleton_warm | 5.26M/s | 3.22M/s | 3.70M/s | 3.98M/s | 8.33M/s |
| transient | 4.00M/s | 2.32M/s | 3.33M/s | 3.32M/s | 5.88M/s |
| deep_graph | 8.26M/s | 4.35M/s | 5.00M/s | 5.26M/s | 8.33M/s |
| wide_graph | 7.69M/s | 4.33M/s | 5.26M/s | 5.24M/s | 7.69M/s |
| factory_deps | 5.00M/s | 3.12M/s | 3.57M/s | 3.83M/s | 5.26M/s |
| register_batch | 373.97K/s | 224.37K/s | 8.92K/s | 5.12K/s | 177.97K/s |
| request_scope | 2.50M/s | N/A | N/A | 340.83K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.02M/s (p99 0.0006ms) (+93.7% vs #2)
2. **tsyringe** - 1.56M/s (p99 0.0012ms)
3. **awilix** - 183.22K/s (p99 0.0116ms)
4. **inversify** - 107.58K/s (p99 0.0225ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 5.26M/s (p99 0.0003ms) (+32.1% vs #2)
2. **awilix** - 3.98M/s (p99 0.0003ms)
3. **inversify** - 3.70M/s (p99 0.0003ms)
4. **tsyringe** - 3.22M/s (p99 0.0004ms)

### transient

1. **@brushy/di-core** 🥇 - 4.00M/s (p99 0.0004ms) (+20.0% vs #2)
2. **inversify** - 3.33M/s (p99 0.0004ms)
3. **awilix** - 3.32M/s (p99 0.0004ms)
4. **tsyringe** - 2.32M/s (p99 0.0006ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 8.26M/s (p99 0.0002ms) (+57.0% vs #2)
2. **awilix** - 5.26M/s (p99 0.0002ms)
3. **inversify** - 5.00M/s (p99 0.0003ms)
4. **tsyringe** - 4.35M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 7.69M/s (p99 0.0002ms) (+46.2% vs #2)
2. **inversify** - 5.26M/s (p99 0.0003ms)
3. **awilix** - 5.24M/s (p99 0.0003ms)
4. **tsyringe** - 4.33M/s (p99 0.0004ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.00M/s (p99 0.0003ms) (+30.5% vs #2)
2. **awilix** - 3.83M/s (p99 0.0004ms)
3. **inversify** - 3.57M/s (p99 0.0003ms)
4. **tsyringe** - 3.12M/s (p99 0.0004ms)

### register_batch

1. **@brushy/di-core** 🥇 - 373.97K/s (p99 0.0045ms) (+66.7% vs #2)
2. **tsyringe** - 224.37K/s (p99 0.0063ms)
3. **inversify** - 8.92K/s (p99 4.8191ms)
4. **awilix** - 5.12K/s (p99 6.3477ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.50M/s (p99 0.0007ms) (+633.5% vs #2)
2. **awilix** - 340.83K/s (p99 0.0068ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +94.7% | +277.1% | +5367.6% | +3110.6% |
| singleton_warm | +58.3% | +159.2% | +125.0% | +109.2% |
| transient | +47.1% | +153.5% | +76.5% | +77.1% |
| deep_graph | +0.8% | +91.7% | +66.7% | +58.3% |
| wide_graph | +0.0% | +77.7% | +46.2% | +46.9% |
| factory_deps | +5.3% | +68.9% | +47.4% | +37.4% |
| register_batch | -52.4% | -20.7% | +1894.3% | +3374.0% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -48.4% | -96.4% | -93.9% |
| singleton_warm | -38.9% | -29.6% | -24.3% |
| transient | -42.0% | -16.7% | -16.9% |
| deep_graph | -47.4% | -39.5% | -36.3% |
| wide_graph | -43.7% | -31.6% | -31.9% |
| factory_deps | -37.7% | -28.6% | -23.4% |
| register_batch | -40.0% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -86.4% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.92M/s | 3.02M/s | 0.0003 | 0.0006 | ±5.39% | 33.5 | 4424421 |
| tsyringe | 1.51M/s | 1.56M/s | 0.0006 | 0.0012 | ±4.41% | 22.7 | 2563173 |
| inversify | 104.29K/s | 107.58K/s | 0.0093 | 0.0225 | ±94.51% | 7.2 | 49323 |
| awilix | 179.78K/s | 183.22K/s | 0.0055 | 0.0116 | ±7.64% | 19.2 | 279870 |
| baseline (new) | 5.78M/s | 5.88M/s | 0.0002 | 0.0002 | ±4.72% | 35.6 | 9342854 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.29M/s | 5.26M/s | 0.0002 | 0.0003 | ±0.06% | 29.2 | 15560764 |
| tsyringe | 3.16M/s | 3.22M/s | 0.0003 | 0.0004 | ±2.06% | 25.6 | 8255261 |
| inversify | 3.69M/s | 3.70M/s | 0.0003 | 0.0003 | ±4.77% | 35.8 | 6636523 |
| awilix | 3.92M/s | 3.98M/s | 0.0003 | 0.0003 | ±5.53% | 35.3 | 8439058 |
| baseline (new) | 8.28M/s | 8.33M/s | 0.0001 | 0.0001 | ±0.05% | 4.0 | 24407254 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.97M/s | 4.00M/s | 0.0003 | 0.0004 | ±2.67% | 31.0 | 8784401 |
| tsyringe | 2.28M/s | 2.32M/s | 0.0004 | 0.0006 | ±3.23% | 30.4 | 4916805 |
| inversify | 3.31M/s | 3.33M/s | 0.0003 | 0.0004 | ±2.29% | 34.9 | 8286969 |
| awilix | 3.26M/s | 3.32M/s | 0.0003 | 0.0004 | ±2.07% | 43.2 | 8245453 |
| baseline (new) | 5.79M/s | 5.88M/s | 0.0002 | 0.0003 | ±3.50% | 34.8 | 10961767 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.00M/s | 8.26M/s | 0.0001 | 0.0002 | ±0.05% | 7.0 | 23521524 |
| tsyringe | 4.33M/s | 4.35M/s | 0.0002 | 0.0003 | ±1.85% | 8.4 | 11082156 |
| inversify | 5.07M/s | 5.00M/s | 0.0002 | 0.0003 | ±3.58% | 4.2 | 9667123 |
| awilix | 5.30M/s | 5.26M/s | 0.0002 | 0.0002 | ±2.36% | 7.9 | 12688470 |
| baseline (new) | 8.56M/s | 8.33M/s | 0.0001 | 0.0002 | ±2.65% | 8.6 | 18163147 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 7.78M/s | 7.69M/s | 0.0001 | 0.0002 | ±0.05% | 7.4 | 22906376 |
| tsyringe | 4.24M/s | 4.33M/s | 0.0002 | 0.0004 | ±2.72% | 5.1 | 10422458 |
| inversify | 5.26M/s | 5.26M/s | 0.0002 | 0.0003 | ±4.11% | 6.5 | 9432291 |
| awilix | 5.14M/s | 5.24M/s | 0.0002 | 0.0003 | ±2.40% | 10.2 | 12211028 |
| baseline (new) | 7.62M/s | 7.69M/s | 0.0001 | 0.0002 | ±4.36% | 7.8 | 10787026 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.96M/s | 5.00M/s | 0.0002 | 0.0003 | ±0.14% | 8.5 | 14569402 |
| tsyringe | 3.06M/s | 3.12M/s | 0.0003 | 0.0004 | ±3.02% | 1.7 | 7198804 |
| inversify | 3.60M/s | 3.57M/s | 0.0003 | 0.0003 | ±0.05% | 2.5 | 10634731 |
| awilix | 3.77M/s | 3.83M/s | 0.0003 | 0.0004 | ±2.60% | 9.0 | 8359903 |
| baseline (new) | 5.36M/s | 5.26M/s | 0.0002 | 0.0003 | ±0.05% | 7.8 | 15717380 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 368.63K/s | 373.97K/s | 0.0027 | 0.0045 | ±3.64% | 1.8 | 641514 |
| tsyringe | 221.25K/s | 224.37K/s | 0.0045 | 0.0063 | ±4.06% | 2.1 | 379138 |
| inversify | 8.63K/s | 8.92K/s | 0.1121 | 4.8191 | ±5.25% | 3.4 | 14861 |
| awilix | 4.90K/s | 5.12K/s | 0.1952 | 6.3477 | ±55.18% | 0.7 | 6561 |
| baseline (new) | 175.92K/s | 177.97K/s | 0.0056 | 0.0073 | ±0.32% | 2.4 | 521679 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.45M/s | 2.50M/s | 0.0004 | 0.0007 | ±3.29% | 2.7 | 4731966 |
| awilix | 326.35K/s | 340.83K/s | 0.0029 | 0.0068 | ±30.93% | 1.0 | 511097 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
