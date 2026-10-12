# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-10-12T14:48:11.525Z
- **Node:** v22.23.3
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 9V45 96-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 6.67M/s | 3.13M/s | 181.88K/s | 361.79K/s | 12.50M/s |
| singleton_warm | 12.50M/s | 7.69M/s | 9.09M/s | 9.09M/s | 16.67M/s |
| transient | 9.01M/s | 5.00M/s | 6.67M/s | 7.14M/s | 12.50M/s |
| deep_graph | 16.67M/s | 9.09M/s | 10.00M/s | 11.11M/s | 16.67M/s |
| wide_graph | 16.67M/s | 9.09M/s | 10.00M/s | 10.00M/s | 20.00M/s |
| factory_deps | 11.11M/s | 7.14M/s | 7.69M/s | 8.33M/s | 12.50M/s |
| register_batch | 632.11K/s | 396.20K/s | 17.55K/s | 10.58K/s | 391.54K/s |
| request_scope | 4.17M/s | N/A | N/A | 665.78K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 6.67M/s (p99 0.0003ms) (+113.3% vs #2)
2. **tsyringe** - 3.13M/s (p99 0.0006ms)
3. **awilix** - 361.79K/s (p99 0.0060ms)
4. **inversify** - 181.88K/s (p99 0.0113ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 12.50M/s (p99 0.0001ms) (+37.5% vs #2)
2. **awilix** - 9.09M/s (p99 0.0001ms)
3. **inversify** - 9.09M/s (p99 0.0001ms)
4. **tsyringe** - 7.69M/s (p99 0.0002ms)

### transient

1. **@brushy/di-core** 🥇 - 9.01M/s (p99 0.0001ms) (+26.1% vs #2)
2. **awilix** - 7.14M/s (p99 0.0002ms)
3. **inversify** - 6.67M/s (p99 0.0002ms)
4. **tsyringe** - 5.00M/s (p99 0.0003ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 16.67M/s (p99 0.0001ms) (+50.0% vs #2)
2. **awilix** - 11.11M/s (p99 0.0001ms)
3. **inversify** - 10.00M/s (p99 0.0001ms)
4. **tsyringe** - 9.09M/s (p99 0.0001ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 16.67M/s (p99 0.0001ms) (+66.7% vs #2)
2. **awilix** - 10.00M/s (p99 0.0001ms)
3. **inversify** - 10.00M/s (p99 0.0001ms)
4. **tsyringe** - 9.09M/s (p99 0.0001ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 11.11M/s (p99 0.0001ms) (+33.3% vs #2)
2. **awilix** - 8.33M/s (p99 0.0001ms)
3. **inversify** - 7.69M/s (p99 0.0002ms)
4. **tsyringe** - 7.14M/s (p99 0.0002ms)

### register_batch

1. **@brushy/di-core** 🥇 - 632.11K/s (p99 0.0022ms) (+59.5% vs #2)
2. **tsyringe** - 396.20K/s (p99 0.0034ms)
3. **inversify** - 17.55K/s (p99 1.9518ms)
4. **awilix** - 10.58K/s (p99 6.8752ms)

### request_scope

1. **@brushy/di-core** 🥇 - 4.17M/s (p99 0.0006ms) (+525.8% vs #2)
2. **awilix** - 665.78K/s (p99 0.0036ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +87.5% | +300.0% | +6772.5% | +3355.0% |
| singleton_warm | +33.3% | +116.7% | +83.3% | +83.3% |
| transient | +38.8% | +150.0% | +87.5% | +75.0% |
| deep_graph | +0.0% | +83.3% | +66.7% | +50.0% |
| wide_graph | +20.0% | +120.0% | +100.0% | +100.0% |
| factory_deps | +12.5% | +75.0% | +62.5% | +50.0% |
| register_batch | -38.1% | -1.2% | +2131.2% | +3602.0% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -53.1% | -97.3% | -94.6% |
| singleton_warm | -38.5% | -27.3% | -27.3% |
| transient | -44.5% | -26.0% | -20.7% |
| deep_graph | -45.5% | -40.0% | -33.3% |
| wide_graph | -45.5% | -40.0% | -40.0% |
| factory_deps | -35.7% | -30.8% | -25.0% |
| register_batch | -37.3% | -97.2% | -98.3% |
| request_scope | N/A | N/A | -84.0% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.49M/s | 6.67M/s | 0.0002 | 0.0003 | ±4.38% | 21.4 | 9022161 |
| tsyringe | 3.02M/s | 3.13M/s | 0.0003 | 0.0006 | ±1.44% | 18.7 | 7126920 |
| inversify | 181.40K/s | 181.88K/s | 0.0055 | 0.0113 | ±7.81% | 3.8 | 165400 |
| awilix | 350.81K/s | 361.79K/s | 0.0028 | 0.0060 | ±7.36% | 11.9 | 443161 |
| baseline (new) | 12.93M/s | 12.50M/s | 0.0001 | 0.0001 | ±1.73% | 24.0 | 27703910 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 12.30M/s | 12.50M/s | 0.0001 | 0.0001 | ±0.07% | 14.1 | 36229087 |
| tsyringe | 7.56M/s | 7.69M/s | 0.0001 | 0.0002 | ±0.78% | 15.0 | 20560363 |
| inversify | 9.31M/s | 9.09M/s | 0.0001 | 0.0001 | ±2.66% | 14.3 | 18276087 |
| awilix | 8.86M/s | 9.09M/s | 0.0001 | 0.0001 | ±1.05% | 15.6 | 23504435 |
| baseline (new) | 17.64M/s | 16.67M/s | 0.0001 | 0.0001 | ±0.11% | 0.0 | 50745370 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.65M/s | 9.01M/s | 0.0001 | 0.0001 | ±2.60% | 25.8 | 18497274 |
| tsyringe | 5.09M/s | 5.00M/s | 0.0002 | 0.0003 | ±1.86% | 21.7 | 12650816 |
| inversify | 6.75M/s | 6.67M/s | 0.0001 | 0.0002 | ±3.82% | 25.5 | 14663394 |
| awilix | 7.00M/s | 7.14M/s | 0.0001 | 0.0002 | ±1.69% | 29.2 | 18262863 |
| baseline (new) | 12.90M/s | 12.50M/s | 0.0001 | 0.0001 | ±2.50% | 24.0 | 25557277 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 16.27M/s | 16.67M/s | 0.0001 | 0.0001 | ±0.04% | 6.5 | 48020054 |
| tsyringe | 9.41M/s | 9.09M/s | 0.0001 | 0.0001 | ±2.46% | 5.4 | 24116356 |
| inversify | 10.22M/s | 10.00M/s | 0.0001 | 0.0001 | ±1.33% | 5.8 | 24183071 |
| awilix | 10.74M/s | 11.11M/s | 0.0001 | 0.0001 | ±2.52% | 0.5 | 27177530 |
| baseline (new) | 16.30M/s | 16.67M/s | 0.0001 | 0.0001 | ±1.37% | 0.0 | 38039082 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 16.11M/s | 16.67M/s | 0.0001 | 0.0001 | ±0.12% | 6.5 | 46486105 |
| tsyringe | 9.21M/s | 9.09M/s | 0.0001 | 0.0001 | ±0.83% | 4.7 | 25067131 |
| inversify | 10.51M/s | 10.00M/s | 0.0001 | 0.0001 | ±1.06% | 5.5 | 26174830 |
| awilix | 10.36M/s | 10.00M/s | 0.0001 | 0.0001 | ±1.46% | 5.5 | 25888150 |
| baseline (new) | 18.90M/s | 20.00M/s | 0.0001 | 0.0001 | ±0.32% | 9.8 | 54890465 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 11.51M/s | 11.11M/s | 0.0001 | 0.0001 | ±1.28% | 5.5 | 33368660 |
| tsyringe | 7.08M/s | 7.14M/s | 0.0001 | 0.0002 | ±1.47% | 3.0 | 17324486 |
| inversify | 7.58M/s | 7.69M/s | 0.0001 | 0.0002 | ±0.09% | 0.3 | 22243564 |
| awilix | 8.17M/s | 8.33M/s | 0.0001 | 0.0001 | ±1.88% | 4.8 | 18321470 |
| baseline (new) | 12.19M/s | 12.50M/s | 0.0001 | 0.0001 | ±0.23% | 9.2 | 35364986 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 633.75K/s | 632.11K/s | 0.0016 | 0.0022 | ±3.61% | 2.4 | 1202914 |
| tsyringe | 400.25K/s | 396.20K/s | 0.0025 | 0.0034 | ±2.02% | 7.2 | 841152 |
| inversify | 16.39K/s | 17.55K/s | 0.0570 | 1.9518 | ±3.06% | 2.8 | 31029 |
| awilix | 10.21K/s | 10.58K/s | 0.0946 | 6.8752 | ±7.48% | 2.7 | 13014 |
| baseline (new) | 386.99K/s | 391.54K/s | 0.0026 | 0.0037 | ±1.40% | 4.6 | 1128948 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.09M/s | 4.17M/s | 0.0002 | 0.0006 | ±116.73% | 3.5 | 2847704 |
| awilix | 635.37K/s | 665.78K/s | 0.0015 | 0.0036 | ±5.95% | 1.6 | 1037275 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
