# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-09-21T12:19:50.968Z
- **Node:** v22.23.2
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 9V45 96-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 6.25M/s | 3.32M/s | 181.88K/s | 355.37K/s | 12.50M/s |
| singleton_warm | 12.50M/s | 7.69M/s | 9.09M/s | 9.09M/s | 20.00M/s |
| transient | 9.09M/s | 5.52M/s | 7.14M/s | 7.63M/s | 12.50M/s |
| deep_graph | 16.67M/s | 10.00M/s | 11.11M/s | 11.11M/s | 16.67M/s |
| wide_graph | 16.67M/s | 9.90M/s | 10.00M/s | 10.00M/s | 20.00M/s |
| factory_deps | 12.50M/s | 7.14M/s | 8.33M/s | 8.33M/s | 12.50M/s |
| register_batch | 648.51K/s | 432.15K/s | 17.22K/s | 10.44K/s | 390.02K/s |
| request_scope | 4.76M/s | N/A | N/A | 665.78K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 6.25M/s (p99 0.0003ms) (+88.1% vs #2)
2. **tsyringe** - 3.32M/s (p99 0.0006ms)
3. **awilix** - 355.37K/s (p99 0.0053ms)
4. **inversify** - 181.88K/s (p99 0.0113ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 12.50M/s (p99 0.0001ms) (+37.5% vs #2)
2. **awilix** - 9.09M/s (p99 0.0002ms)
3. **inversify** - 9.09M/s (p99 0.0001ms)
4. **tsyringe** - 7.69M/s (p99 0.0002ms)

### transient

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+19.1% vs #2)
2. **awilix** - 7.63M/s (p99 0.0002ms)
3. **inversify** - 7.14M/s (p99 0.0003ms)
4. **tsyringe** - 5.52M/s (p99 0.0002ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 16.67M/s (p99 0.0001ms) (+50.0% vs #2)
2. **awilix** - 11.11M/s (p99 0.0001ms)
3. **inversify** - 11.11M/s (p99 0.0001ms)
4. **tsyringe** - 10.00M/s (p99 0.0002ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 16.67M/s (p99 0.0001ms) (+66.7% vs #2)
2. **awilix** - 10.00M/s (p99 0.0001ms)
3. **inversify** - 10.00M/s (p99 0.0001ms)
4. **tsyringe** - 9.90M/s (p99 0.0001ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 12.50M/s (p99 0.0001ms) (+50.0% vs #2)
2. **awilix** - 8.33M/s (p99 0.0001ms)
3. **inversify** - 8.33M/s (p99 0.0001ms)
4. **tsyringe** - 7.14M/s (p99 0.0002ms)

### register_batch

1. **@brushy/di-core** 🥇 - 648.51K/s (p99 0.0023ms) (+50.1% vs #2)
2. **tsyringe** - 432.15K/s (p99 0.0033ms)
3. **inversify** - 17.22K/s (p99 2.2345ms)
4. **awilix** - 10.44K/s (p99 3.9302ms)

### request_scope

1. **@brushy/di-core** 🥇 - 4.76M/s (p99 0.0003ms) (+615.2% vs #2)
2. **awilix** - 665.78K/s (p99 0.0037ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +100.0% | +276.3% | +6772.5% | +3417.5% |
| singleton_warm | +60.0% | +160.0% | +120.0% | +120.0% |
| transient | +37.5% | +126.3% | +75.0% | +63.8% |
| deep_graph | +0.0% | +66.7% | +50.0% | +50.0% |
| wide_graph | +20.0% | +102.0% | +100.0% | +100.0% |
| factory_deps | +0.0% | +75.0% | +50.0% | +50.0% |
| register_batch | -39.9% | -9.8% | +2165.1% | +3635.8% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -46.8% | -97.1% | -94.3% |
| singleton_warm | -38.5% | -27.3% | -27.3% |
| transient | -39.2% | -21.4% | -16.0% |
| deep_graph | -40.0% | -33.3% | -33.3% |
| wide_graph | -40.6% | -40.0% | -40.0% |
| factory_deps | -42.9% | -33.3% | -33.3% |
| register_batch | -33.4% | -97.3% | -98.4% |
| request_scope | N/A | N/A | -86.0% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.20M/s | 6.25M/s | 0.0002 | 0.0003 | ±1.73% | 29.3 | 13559582 |
| tsyringe | 3.17M/s | 3.32M/s | 0.0003 | 0.0006 | ±4.82% | 8.5 | 4931981 |
| inversify | 178.71K/s | 181.88K/s | 0.0055 | 0.0113 | ±42.33% | 1.3 | 156928 |
| awilix | 340.29K/s | 355.37K/s | 0.0028 | 0.0053 | ±7.40% | 9.3 | 416832 |
| baseline (new) | 12.52M/s | 12.50M/s | 0.0001 | 0.0001 | ±3.52% | 22.7 | 20292137 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 11.88M/s | 12.50M/s | 0.0001 | 0.0001 | ±0.03% | 22.8 | 35180163 |
| tsyringe | 7.50M/s | 7.69M/s | 0.0001 | 0.0002 | ±1.75% | 15.0 | 19895960 |
| inversify | 9.20M/s | 9.09M/s | 0.0001 | 0.0001 | ±4.15% | 24.4 | 15123800 |
| awilix | 9.14M/s | 9.09M/s | 0.0001 | 0.0002 | ±2.29% | 25.7 | 22931436 |
| baseline (new) | 18.47M/s | 20.00M/s | 0.0001 | 0.0001 | ±0.08% | 7.6 | 53939085 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.76M/s | 9.09M/s | 0.0001 | 0.0001 | ±1.22% | 25.7 | 21720638 |
| tsyringe | 5.39M/s | 5.52M/s | 0.0002 | 0.0002 | ±1.91% | 18.2 | 12575885 |
| inversify | 7.19M/s | 7.14M/s | 0.0001 | 0.0003 | ±5.54% | 21.5 | 11831478 |
| awilix | 7.41M/s | 7.63M/s | 0.0001 | 0.0002 | ±0.93% | 36.4 | 19979053 |
| baseline (new) | 12.96M/s | 12.50M/s | 0.0001 | 0.0001 | ±5.58% | 22.6 | 15850098 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 16.36M/s | 16.67M/s | 0.0001 | 0.0001 | ±0.62% | 0.0 | 47934721 |
| tsyringe | 9.90M/s | 10.00M/s | 0.0001 | 0.0002 | ±1.41% | 4.1 | 26259485 |
| inversify | 11.07M/s | 11.11M/s | 0.0001 | 0.0001 | ±6.62% | 9.4 | 10539694 |
| awilix | 11.11M/s | 11.11M/s | 0.0001 | 0.0001 | ±3.82% | 9.0 | 26237004 |
| baseline (new) | 16.92M/s | 16.67M/s | 0.0001 | 0.0001 | ±1.17% | 0.7 | 40961587 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 16.72M/s | 16.67M/s | 0.0001 | 0.0001 | ±1.29% | 6.6 | 48316969 |
| tsyringe | 9.57M/s | 9.90M/s | 0.0001 | 0.0001 | ±1.61% | 7.8 | 25811185 |
| inversify | 10.42M/s | 10.00M/s | 0.0001 | 0.0001 | ±2.81% | 8.4 | 24023166 |
| awilix | 10.09M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.40% | 10.3 | 29176550 |
| baseline (new) | 19.27M/s | 20.00M/s | 0.0001 | 0.0001 | ±0.03% | 7.7 | 56925855 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 12.24M/s | 12.50M/s | 0.0001 | 0.0001 | ±0.07% | 5.1 | 36145810 |
| tsyringe | 7.28M/s | 7.14M/s | 0.0001 | 0.0002 | ±0.93% | 3.4 | 18649311 |
| inversify | 8.31M/s | 8.33M/s | 0.0001 | 0.0001 | ±0.10% | 6.8 | 24454259 |
| awilix | 8.62M/s | 8.33M/s | 0.0001 | 0.0001 | ±0.02% | 8.5 | 25575999 |
| baseline (new) | 12.37M/s | 12.50M/s | 0.0001 | 0.0001 | ±0.03% | 9.0 | 36624113 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 651.58K/s | 648.51K/s | 0.0015 | 0.0023 | ±3.32% | 2.6 | 1296053 |
| tsyringe | 424.12K/s | 432.15K/s | 0.0023 | 0.0033 | ±2.82% | 3.7 | 821187 |
| inversify | 15.73K/s | 17.22K/s | 0.0581 | 2.2345 | ±34.21% | 3.0 | 23046 |
| awilix | 10.10K/s | 10.44K/s | 0.0958 | 3.9302 | ±10.82% | 2.7 | 16047 |
| baseline (new) | 387.16K/s | 390.02K/s | 0.0026 | 0.0029 | ±0.86% | 3.7 | 1147957 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.69M/s | 4.76M/s | 0.0002 | 0.0003 | ±1.22% | 4.0 | 11357082 |
| awilix | 634.76K/s | 665.78K/s | 0.0015 | 0.0037 | ±45.12% | 3.2 | 656176 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
