# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-09-12T22:19:26.419Z
- **Node:** v22.23.2
- **Platform:** linux (x64)
- **CPUs:** 16 × AMD Ryzen 7 5700X 8-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 4.52M/s | 2.56M/s | 167.20K/s | 296.21K/s | 10.00M/s |
| singleton_warm | 8.33M/s | 5.26M/s | 6.25M/s | 6.67M/s | 14.29M/s |
| transient | 6.21M/s | 3.70M/s | 5.26M/s | 5.24M/s | 9.90M/s |
| deep_graph | 12.50M/s | 7.14M/s | 9.01M/s | 9.09M/s | 12.50M/s |
| wide_graph | 12.50M/s | 7.14M/s | 8.33M/s | 8.33M/s | 12.50M/s |
| factory_deps | 8.33M/s | 5.24M/s | 5.88M/s | 6.62M/s | 7.14M/s |
| register_batch | 648.09K/s | 382.41K/s | 15.53K/s | 8.64K/s | 295.25K/s |
| request_scope | 3.83M/s | N/A | N/A | 560.85K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 4.52M/s (p99 0.0005ms) (+76.9% vs #2)
2. **tsyringe** - 2.56M/s (p99 0.0008ms)
3. **awilix** - 296.21K/s (p99 0.0073ms)
4. **inversify** - 167.20K/s (p99 0.0148ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 8.33M/s (p99 0.0002ms) (+25.0% vs #2)
2. **awilix** - 6.67M/s (p99 0.0003ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 5.26M/s (p99 0.0004ms)

### transient

1. **@brushy/di-core** 🥇 - 6.21M/s (p99 0.0003ms) (+18.0% vs #2)
2. **inversify** - 5.26M/s (p99 0.0002ms)
3. **awilix** - 5.24M/s (p99 0.0004ms)
4. **tsyringe** - 3.70M/s (p99 0.0005ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 12.50M/s (p99 0.0001ms) (+37.5% vs #2)
2. **awilix** - 9.09M/s (p99 0.0002ms)
3. **inversify** - 9.01M/s (p99 0.0002ms)
4. **tsyringe** - 7.14M/s (p99 0.0002ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 12.50M/s (p99 0.0001ms) (+50.0% vs #2)
2. **awilix** - 8.33M/s (p99 0.0002ms)
3. **inversify** - 8.33M/s (p99 0.0002ms)
4. **tsyringe** - 7.14M/s (p99 0.0002ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 8.33M/s (p99 0.0002ms) (+25.8% vs #2)
2. **awilix** - 6.62M/s (p99 0.0003ms)
3. **inversify** - 5.88M/s (p99 0.0002ms)
4. **tsyringe** - 5.24M/s (p99 0.0004ms)

### register_batch

1. **@brushy/di-core** 🥇 - 648.09K/s (p99 0.0028ms) (+69.5% vs #2)
2. **tsyringe** - 382.41K/s (p99 0.0043ms)
3. **inversify** - 15.53K/s (p99 3.9599ms)
4. **awilix** - 8.64K/s (p99 5.3945ms)

### request_scope

1. **@brushy/di-core** 🥇 - 3.83M/s (p99 0.0005ms) (+583.1% vs #2)
2. **awilix** - 560.85K/s (p99 0.0044ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +121.0% | +291.0% | +5881.0% | +3276.0% |
| singleton_warm | +71.4% | +171.4% | +128.6% | +114.3% |
| transient | +59.4% | +167.3% | +88.1% | +89.1% |
| deep_graph | +0.0% | +75.0% | +38.8% | +37.5% |
| wide_graph | +0.0% | +75.0% | +50.0% | +50.0% |
| factory_deps | -14.3% | +36.4% | +21.4% | +7.9% |
| register_batch | -54.4% | -22.8% | +1800.9% | +3316.3% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -43.5% | -96.3% | -93.5% |
| singleton_warm | -36.8% | -25.0% | -20.0% |
| transient | -40.4% | -15.3% | -15.7% |
| deep_graph | -42.9% | -27.9% | -27.3% |
| wide_graph | -42.9% | -33.3% | -33.3% |
| factory_deps | -37.2% | -29.4% | -20.5% |
| register_batch | -41.0% | -97.6% | -98.7% |
| request_scope | N/A | N/A | -85.4% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.38M/s | 4.52M/s | 0.0002 | 0.0005 | ±3.29% | 24.4 | 8285628 |
| tsyringe | 2.51M/s | 2.56M/s | 0.0004 | 0.0008 | ±4.01% | 12.8 | 4384060 |
| inversify | 161.61K/s | 167.20K/s | 0.0060 | 0.0148 | ±42.46% | 2.9 | 149758 |
| awilix | 286.09K/s | 296.21K/s | 0.0034 | 0.0073 | ±5.48% | 14.0 | 464623 |
| baseline (new) | 9.53M/s | 10.00M/s | 0.0001 | 0.0002 | ±1.82% | 29.3 | 21366964 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.49M/s | 8.33M/s | 0.0001 | 0.0002 | ±0.03% | 27.1 | 25006489 |
| tsyringe | 5.18M/s | 5.26M/s | 0.0002 | 0.0004 | ±2.10% | 18.9 | 13142442 |
| inversify | 6.38M/s | 6.25M/s | 0.0002 | 0.0002 | ±2.32% | 23.2 | 14075270 |
| awilix | 6.55M/s | 6.67M/s | 0.0001 | 0.0003 | ±2.52% | 26.3 | 15462439 |
| baseline (new) | 13.47M/s | 14.29M/s | 0.0001 | 0.0001 | ±0.02% | 0.0 | 39805004 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.97M/s | 6.21M/s | 0.0002 | 0.0003 | ±3.00% | 31.3 | 12320640 |
| tsyringe | 3.62M/s | 3.70M/s | 0.0003 | 0.0005 | ±3.07% | 20.1 | 7808324 |
| inversify | 5.22M/s | 5.26M/s | 0.0002 | 0.0002 | ±2.45% | 29.3 | 13508685 |
| awilix | 5.03M/s | 5.24M/s | 0.0002 | 0.0004 | ±2.81% | 35.9 | 11574331 |
| baseline (new) | 9.48M/s | 9.90M/s | 0.0001 | 0.0002 | ±2.58% | 18.2 | 19026040 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 12.82M/s | 12.50M/s | 0.0001 | 0.0001 | ±0.03% | 0.0 | 37743940 |
| tsyringe | 6.97M/s | 7.14M/s | 0.0001 | 0.0002 | ±1.27% | 0.0 | 18461259 |
| inversify | 8.62M/s | 9.01M/s | 0.0001 | 0.0002 | ±3.15% | 4.6 | 16395831 |
| awilix | 8.83M/s | 9.09M/s | 0.0001 | 0.0002 | ±2.61% | 3.7 | 21426990 |
| baseline (new) | 12.84M/s | 12.50M/s | 0.0001 | 0.0001 | ±2.02% | 5.5 | 29140925 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 13.03M/s | 12.50M/s | 0.0001 | 0.0001 | ±1.30% | 0.0 | 38209805 |
| tsyringe | 7.09M/s | 7.14M/s | 0.0001 | 0.0002 | ±1.49% | 3.0 | 18638481 |
| inversify | 8.21M/s | 8.33M/s | 0.0001 | 0.0002 | ±2.43% | 6.0 | 17096589 |
| awilix | 8.48M/s | 8.33M/s | 0.0001 | 0.0002 | ±2.23% | 8.4 | 19969300 |
| baseline (new) | 12.53M/s | 12.50M/s | 0.0001 | 0.0001 | ±2.40% | 0.0 | 23501865 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.06M/s | 8.33M/s | 0.0001 | 0.0002 | ±0.02% | 3.8 | 23883236 |
| tsyringe | 5.03M/s | 5.24M/s | 0.0002 | 0.0004 | ±2.59% | 7.7 | 11049199 |
| inversify | 5.94M/s | 5.88M/s | 0.0002 | 0.0002 | ±0.04% | 5.4 | 17622779 |
| awilix | 6.34M/s | 6.62M/s | 0.0002 | 0.0003 | ±2.23% | 3.3 | 14020369 |
| baseline (new) | 7.10M/s | 7.14M/s | 0.0001 | 0.0003 | ±0.08% | 0.3 | 20935163 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 629.84K/s | 648.09K/s | 0.0015 | 0.0028 | ±2.64% | 4.7 | 1220419 |
| tsyringe | 373.81K/s | 382.41K/s | 0.0026 | 0.0043 | ±2.05% | 3.6 | 783995 |
| inversify | 14.53K/s | 15.53K/s | 0.0644 | 3.9599 | ±91.87% | 3.6 | 12864 |
| awilix | 8.27K/s | 8.64K/s | 0.1157 | 5.3945 | ±63.09% | 0.8 | 10794 |
| baseline (new) | 292.02K/s | 295.25K/s | 0.0034 | 0.0064 | ±0.30% | 6.1 | 866103 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.74M/s | 3.83M/s | 0.0003 | 0.0005 | ±4.38% | 1.6 | 5979233 |
| awilix | 536.70K/s | 560.85K/s | 0.0018 | 0.0044 | ±13.42% | 0.6 | 980656 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
