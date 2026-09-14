# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-09-14T12:11:30.030Z
- **Node:** v22.23.2
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 9V74 80-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.44M/s | 1.81M/s | 117.90K/s | 212.45K/s | 7.09M/s |
| singleton_warm | 6.21M/s | 3.69M/s | 4.33M/s | 4.55M/s | 10.00M/s |
| transient | 4.74M/s | 2.63M/s | 3.70M/s | 3.83M/s | 6.67M/s |
| deep_graph | 9.01M/s | 5.00M/s | 5.56M/s | 5.88M/s | 10.00M/s |
| wide_graph | 9.09M/s | 5.00M/s | 5.88M/s | 5.88M/s | 9.09M/s |
| factory_deps | 5.88M/s | 3.57M/s | 4.17M/s | 4.35M/s | 5.00M/s |
| register_batch | 414.25K/s | 252.14K/s | 9.93K/s | 5.97K/s | 202.55K/s |
| request_scope | 2.93M/s | N/A | N/A | 391.54K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.44M/s (p99 0.0005ms) (+89.3% vs #2)
2. **tsyringe** - 1.81M/s (p99 0.0011ms)
3. **awilix** - 212.45K/s (p99 0.0089ms)
4. **inversify** - 117.90K/s (p99 0.0197ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 6.21M/s (p99 0.0003ms) (+36.6% vs #2)
2. **awilix** - 4.55M/s (p99 0.0004ms)
3. **inversify** - 4.33M/s (p99 0.0003ms)
4. **tsyringe** - 3.69M/s (p99 0.0004ms)

### transient

1. **@brushy/di-core** 🥇 - 4.74M/s (p99 0.0004ms) (+23.7% vs #2)
2. **awilix** - 3.83M/s (p99 0.0005ms)
3. **inversify** - 3.70M/s (p99 0.0004ms)
4. **tsyringe** - 2.63M/s (p99 0.0006ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.01M/s (p99 0.0001ms) (+53.2% vs #2)
2. **awilix** - 5.88M/s (p99 0.0003ms)
3. **inversify** - 5.56M/s (p99 0.0003ms)
4. **tsyringe** - 5.00M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+54.5% vs #2)
2. **awilix** - 5.88M/s (p99 0.0002ms)
3. **inversify** - 5.88M/s (p99 0.0003ms)
4. **tsyringe** - 5.00M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0003ms) (+35.3% vs #2)
2. **awilix** - 4.35M/s (p99 0.0004ms)
3. **inversify** - 4.17M/s (p99 0.0004ms)
4. **tsyringe** - 3.57M/s (p99 0.0004ms)

### register_batch

1. **@brushy/di-core** 🥇 - 414.25K/s (p99 0.0034ms) (+64.3% vs #2)
2. **tsyringe** - 252.14K/s (p99 0.0057ms)
3. **inversify** - 9.93K/s (p99 7.4424ms)
4. **awilix** - 5.97K/s (p99 5.5925ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.93M/s (p99 0.0006ms) (+649.0% vs #2)
2. **awilix** - 391.54K/s (p99 0.0059ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +106.4% | +290.8% | +5915.6% | +3238.3% |
| singleton_warm | +61.0% | +171.0% | +131.0% | +120.0% |
| transient | +40.7% | +153.3% | +80.0% | +74.0% |
| deep_graph | +11.0% | +100.0% | +80.0% | +70.0% |
| wide_graph | -0.0% | +81.8% | +54.5% | +54.5% |
| factory_deps | -15.0% | +40.0% | +20.0% | +15.0% |
| register_batch | -51.1% | -19.7% | +1940.1% | +3292.7% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -47.2% | -96.6% | -93.8% |
| singleton_warm | -40.6% | -30.3% | -26.8% |
| transient | -44.5% | -21.9% | -19.2% |
| deep_graph | -44.5% | -38.3% | -34.7% |
| wide_graph | -45.0% | -35.3% | -35.3% |
| factory_deps | -39.3% | -29.2% | -26.1% |
| register_batch | -39.1% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -86.6% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.34M/s | 3.44M/s | 0.0003 | 0.0005 | ±4.02% | 25.0 | 5856128 |
| tsyringe | 1.74M/s | 1.81M/s | 0.0006 | 0.0011 | ±4.12% | 10.9 | 2981422 |
| inversify | 116.47K/s | 117.90K/s | 0.0085 | 0.0197 | ±9.25% | 6.8 | 110755 |
| awilix | 207.17K/s | 212.45K/s | 0.0047 | 0.0089 | ±6.61% | 9.1 | 334656 |
| baseline (new) | 6.84M/s | 7.09M/s | 0.0001 | 0.0003 | ±4.11% | 24.6 | 11575103 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.01M/s | 6.21M/s | 0.0002 | 0.0003 | ±0.07% | 20.6 | 17618795 |
| tsyringe | 3.64M/s | 3.69M/s | 0.0003 | 0.0004 | ±3.95% | 18.0 | 9153830 |
| inversify | 4.26M/s | 4.33M/s | 0.0002 | 0.0003 | ±3.04% | 22.9 | 8993600 |
| awilix | 4.57M/s | 4.55M/s | 0.0002 | 0.0004 | ±2.06% | 28.5 | 11331527 |
| baseline (new) | 9.59M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.16% | 7.7 | 28216519 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.64M/s | 4.74M/s | 0.0002 | 0.0004 | ±5.71% | 24.7 | 7400034 |
| tsyringe | 2.61M/s | 2.63M/s | 0.0004 | 0.0006 | ±5.10% | 18.4 | 4845563 |
| inversify | 3.68M/s | 3.70M/s | 0.0003 | 0.0004 | ±4.08% | 26.2 | 7945116 |
| awilix | 3.73M/s | 3.83M/s | 0.0003 | 0.0005 | ±3.45% | 34.0 | 8190083 |
| baseline (new) | 6.54M/s | 6.67M/s | 0.0001 | 0.0002 | ±3.07% | 28.3 | 12711457 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.69M/s | 9.01M/s | 0.0001 | 0.0001 | ±2.25% | 7.5 | 25291770 |
| tsyringe | 4.94M/s | 5.00M/s | 0.0002 | 0.0003 | ±3.06% | 7.1 | 12187913 |
| inversify | 5.59M/s | 5.56M/s | 0.0002 | 0.0003 | ±4.80% | 2.8 | 8987574 |
| awilix | 5.88M/s | 5.88M/s | 0.0002 | 0.0003 | ±2.03% | 7.0 | 14197841 |
| baseline (new) | 9.78M/s | 10.00M/s | 0.0001 | 0.0002 | ±4.51% | 4.1 | 15996780 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.39M/s | 9.09M/s | 0.0001 | 0.0001 | ±0.09% | 3.8 | 27642977 |
| tsyringe | 4.87M/s | 5.00M/s | 0.0002 | 0.0003 | ±2.27% | 0.2 | 11948679 |
| inversify | 5.77M/s | 5.88M/s | 0.0002 | 0.0003 | ±4.90% | 4.7 | 9193605 |
| awilix | 5.97M/s | 5.88M/s | 0.0002 | 0.0002 | ±2.02% | 0.3 | 14494478 |
| baseline (new) | 8.58M/s | 9.09M/s | 0.0001 | 0.0002 | ±108.18% | 3.8 | 4674479 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.88M/s | 5.88M/s | 0.0002 | 0.0003 | ±2.01% | 0.0 | 17056190 |
| tsyringe | 3.54M/s | 3.57M/s | 0.0003 | 0.0004 | ±1.86% | 1.6 | 9283058 |
| inversify | 4.13M/s | 4.17M/s | 0.0002 | 0.0004 | ±0.08% | 2.8 | 12096092 |
| awilix | 4.28M/s | 4.35M/s | 0.0002 | 0.0004 | ±4.42% | 4.3 | 7605027 |
| baseline (new) | 5.05M/s | 5.00M/s | 0.0002 | 0.0003 | ±2.20% | 3.9 | 14552591 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 409.47K/s | 414.25K/s | 0.0024 | 0.0034 | ±1.26% | 1.4 | 998616 |
| tsyringe | 247.37K/s | 252.14K/s | 0.0040 | 0.0057 | ±7.36% | 2.2 | 254823 |
| inversify | 9.58K/s | 9.93K/s | 0.1007 | 7.4424 | ±7.25% | 1.3 | 12837 |
| awilix | 5.72K/s | 5.97K/s | 0.1675 | 5.5925 | ±39.26% | 0.7 | 8404 |
| baseline (new) | 200.28K/s | 202.55K/s | 0.0049 | 0.0063 | ±0.35% | 6.2 | 593213 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.81M/s | 2.93M/s | 0.0003 | 0.0006 | ±2.81% | 3.5 | 5668124 |
| awilix | 372.86K/s | 391.54K/s | 0.0026 | 0.0059 | ±70.30% | 1.1 | 435078 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
