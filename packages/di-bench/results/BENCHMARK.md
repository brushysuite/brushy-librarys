# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-11-23T17:39:46.080Z
- **Node:** v22.23.5
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 7763 64-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.12M/s | 1.78M/s | 125.55K/s | 216.03K/s | 6.67M/s |
| singleton_warm | 6.25M/s | 3.69M/s | 4.52M/s | 4.74M/s | 10.00M/s |
| transient | 4.33M/s | 2.70M/s | 3.83M/s | 3.56M/s | 6.67M/s |
| deep_graph | 9.09M/s | 4.98M/s | 6.21M/s | 6.67M/s | 11.11M/s |
| wide_graph | 9.90M/s | 4.98M/s | 6.25M/s | 6.25M/s | 9.09M/s |
| factory_deps | 5.88M/s | 3.57M/s | 4.17M/s | 4.55M/s | 5.00M/s |
| register_batch | 457.88K/s | 271.96K/s | 11.04K/s | 6.18K/s | 199.20K/s |
| request_scope | 2.62M/s | N/A | N/A | 394.63K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.12M/s (p99 0.0005ms) (+74.8% vs #2)
2. **tsyringe** - 1.78M/s (p99 0.0010ms)
3. **awilix** - 216.03K/s (p99 0.0108ms)
4. **inversify** - 125.55K/s (p99 0.0206ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 6.25M/s (p99 0.0002ms) (+31.9% vs #2)
2. **awilix** - 4.74M/s (p99 0.0003ms)
3. **inversify** - 4.52M/s (p99 0.0004ms)
4. **tsyringe** - 3.69M/s (p99 0.0004ms)

### transient

1. **@brushy/di-core** 🥇 - 4.33M/s (p99 0.0003ms) (+13.0% vs #2)
2. **inversify** - 3.83M/s (p99 0.0003ms)
3. **awilix** - 3.56M/s (p99 0.0005ms)
4. **tsyringe** - 2.70M/s (p99 0.0006ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+36.4% vs #2)
2. **awilix** - 6.67M/s (p99 0.0002ms)
3. **inversify** - 6.21M/s (p99 0.0002ms)
4. **tsyringe** - 4.98M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 9.90M/s (p99 0.0001ms) (+58.4% vs #2)
2. **awilix** - 6.25M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 4.98M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0003ms) (+29.4% vs #2)
2. **awilix** - 4.55M/s (p99 0.0003ms)
3. **inversify** - 4.17M/s (p99 0.0003ms)
4. **tsyringe** - 3.57M/s (p99 0.0005ms)

### register_batch

1. **@brushy/di-core** 🥇 - 457.88K/s (p99 0.0033ms) (+68.4% vs #2)
2. **tsyringe** - 271.96K/s (p99 0.0062ms)
3. **inversify** - 11.04K/s (p99 4.9694ms)
4. **awilix** - 6.18K/s (p99 7.5461ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.62M/s (p99 0.0007ms) (+565.1% vs #2)
2. **awilix** - 394.63K/s (p99 0.0062ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +114.0% | +274.0% | +5210.0% | +2986.0% |
| singleton_warm | +60.0% | +171.0% | +121.0% | +111.0% |
| transient | +54.0% | +147.3% | +74.0% | +87.3% |
| deep_graph | +22.2% | +123.3% | +78.9% | +66.7% |
| wide_graph | -8.2% | +82.7% | +45.5% | +45.5% |
| factory_deps | -15.0% | +40.0% | +20.0% | +10.0% |
| register_batch | -56.5% | -26.8% | +1704.4% | +3122.0% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -42.8% | -96.0% | -93.1% |
| singleton_warm | -41.0% | -27.6% | -24.2% |
| transient | -37.7% | -11.5% | -17.8% |
| deep_graph | -45.3% | -31.7% | -26.7% |
| wide_graph | -49.8% | -36.9% | -36.9% |
| factory_deps | -39.3% | -29.2% | -22.7% |
| register_batch | -40.6% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -85.0% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.05M/s | 3.12M/s | 0.0003 | 0.0005 | ±2.44% | 28.0 | 6555935 |
| tsyringe | 1.76M/s | 1.78M/s | 0.0006 | 0.0010 | ±4.41% | 13.0 | 2955008 |
| inversify | 123.64K/s | 125.55K/s | 0.0080 | 0.0206 | ±8.85% | 3.9 | 123643 |
| awilix | 209.19K/s | 216.03K/s | 0.0046 | 0.0108 | ±6.81% | 12.4 | 333390 |
| baseline (new) | 6.67M/s | 6.67M/s | 0.0001 | 0.0003 | ±3.66% | 32.7 | 11995029 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.17M/s | 6.25M/s | 0.0002 | 0.0002 | ±0.06% | 24.0 | 18149769 |
| tsyringe | 3.61M/s | 3.69M/s | 0.0003 | 0.0004 | ±3.29% | 17.5 | 8555289 |
| inversify | 4.46M/s | 4.52M/s | 0.0002 | 0.0004 | ±4.15% | 23.7 | 8185583 |
| awilix | 4.62M/s | 4.74M/s | 0.0002 | 0.0003 | ±3.88% | 26.0 | 10868341 |
| baseline (new) | 10.39M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.04% | 0.0 | 30574360 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.29M/s | 4.33M/s | 0.0002 | 0.0003 | ±4.66% | 30.0 | 7551270 |
| tsyringe | 2.65M/s | 2.70M/s | 0.0004 | 0.0006 | ±3.46% | 17.7 | 5732262 |
| inversify | 3.78M/s | 3.83M/s | 0.0003 | 0.0003 | ±2.36% | 22.1 | 9330198 |
| awilix | 3.47M/s | 3.56M/s | 0.0003 | 0.0005 | ±2.64% | 30.0 | 8380359 |
| baseline (new) | 6.55M/s | 6.67M/s | 0.0001 | 0.0003 | ±4.63% | 26.3 | 10437953 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.19M/s | 9.09M/s | 0.0001 | 0.0001 | ±0.05% | 4.7 | 26991356 |
| tsyringe | 4.81M/s | 4.98M/s | 0.0002 | 0.0003 | ±3.07% | 2.6 | 11730362 |
| inversify | 6.04M/s | 6.21M/s | 0.0002 | 0.0002 | ±2.18% | 5.4 | 13543801 |
| awilix | 6.62M/s | 6.67M/s | 0.0002 | 0.0002 | ±1.11% | 2.8 | 17583657 |
| baseline (new) | 11.05M/s | 11.11M/s | 0.0001 | 0.0001 | ±0.04% | 5.0 | 32472190 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.46M/s | 9.90M/s | 0.0001 | 0.0001 | ±0.06% | 5.0 | 27758545 |
| tsyringe | 4.88M/s | 4.98M/s | 0.0002 | 0.0003 | ±3.58% | 2.1 | 10804131 |
| inversify | 6.10M/s | 6.25M/s | 0.0002 | 0.0002 | ±3.92% | 0.3 | 10613923 |
| awilix | 6.13M/s | 6.25M/s | 0.0002 | 0.0002 | ±4.18% | 3.0 | 12062406 |
| baseline (new) | 8.95M/s | 9.09M/s | 0.0001 | 0.0002 | ±5.80% | 0.0 | 9344342 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.92M/s | 5.88M/s | 0.0002 | 0.0003 | ±0.33% | 2.9 | 17360321 |
| tsyringe | 3.54M/s | 3.57M/s | 0.0003 | 0.0005 | ±3.91% | 1.5 | 6614893 |
| inversify | 4.16M/s | 4.17M/s | 0.0002 | 0.0003 | ±0.04% | 4.7 | 12274212 |
| awilix | 4.50M/s | 4.55M/s | 0.0002 | 0.0003 | ±5.03% | 2.2 | 7358350 |
| baseline (new) | 5.01M/s | 5.00M/s | 0.0002 | 0.0004 | ±0.04% | 2.8 | 14719012 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 450.92K/s | 457.88K/s | 0.0022 | 0.0033 | ±2.52% | 0.7 | 905776 |
| tsyringe | 265.96K/s | 271.96K/s | 0.0037 | 0.0062 | ±5.92% | 0.9 | 339266 |
| inversify | 10.43K/s | 11.04K/s | 0.0906 | 4.9694 | ±5.48% | 0.7 | 16479 |
| awilix | 5.88K/s | 6.18K/s | 0.1617 | 7.5461 | ±10.54% | 1.7 | 8413 |
| baseline (new) | 197.24K/s | 199.20K/s | 0.0050 | 0.0092 | ±0.68% | 1.0 | 581425 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.59M/s | 2.62M/s | 0.0004 | 0.0007 | ±6.05% | 2.2 | 3519557 |
| awilix | 377.57K/s | 394.63K/s | 0.0025 | 0.0062 | ±5.69% | 0.2 | 692636 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
