# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-11-02T15:04:54.004Z
- **Node:** v22.23.4
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 7763 64-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.12M/s | 1.78M/s | 122.62K/s | 212.81K/s | 6.67M/s |
| singleton_warm | 6.21M/s | 3.83M/s | 4.76M/s | 4.55M/s | 10.00M/s |
| transient | 4.33M/s | 2.56M/s | 3.83M/s | 3.69M/s | 6.67M/s |
| deep_graph | 9.90M/s | 5.26M/s | 6.25M/s | 6.25M/s | 9.09M/s |
| wide_graph | 9.09M/s | 5.26M/s | 6.62M/s | 6.25M/s | 9.09M/s |
| factory_deps | 5.88M/s | 3.70M/s | 4.55M/s | 4.55M/s | 4.76M/s |
| register_batch | 461.89K/s | 272.78K/s | 10.99K/s | 6.11K/s | 202.06K/s |
| request_scope | 2.62M/s | N/A | N/A | 402.41K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.12M/s (p99 0.0005ms) (+75.3% vs #2)
2. **tsyringe** - 1.78M/s (p99 0.0010ms)
3. **awilix** - 212.81K/s (p99 0.0130ms)
4. **inversify** - 122.62K/s (p99 0.0240ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 6.21M/s (p99 0.0002ms) (+30.4% vs #2)
2. **inversify** - 4.76M/s (p99 0.0003ms)
3. **awilix** - 4.55M/s (p99 0.0003ms)
4. **tsyringe** - 3.83M/s (p99 0.0003ms)

### transient

1. **@brushy/di-core** 🥇 - 4.33M/s (p99 0.0003ms) (+13.0% vs #2)
2. **inversify** - 3.83M/s (p99 0.0003ms)
3. **awilix** - 3.69M/s (p99 0.0003ms)
4. **tsyringe** - 2.56M/s (p99 0.0005ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.90M/s (p99 0.0001ms) (+58.4% vs #2)
2. **awilix** - 6.25M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 5.26M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+37.3% vs #2)
2. **inversify** - 6.62M/s (p99 0.0002ms)
3. **awilix** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 5.26M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0002ms) (+29.4% vs #2)
2. **awilix** - 4.55M/s (p99 0.0003ms)
3. **inversify** - 4.55M/s (p99 0.0003ms)
4. **tsyringe** - 3.70M/s (p99 0.0003ms)

### register_batch

1. **@brushy/di-core** 🥇 - 461.89K/s (p99 0.0039ms) (+69.3% vs #2)
2. **tsyringe** - 272.78K/s (p99 0.0061ms)
3. **inversify** - 10.99K/s (p99 4.2107ms)
4. **awilix** - 6.11K/s (p99 5.4693ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.62M/s (p99 0.0006ms) (+552.2% vs #2)
2. **awilix** - 402.41K/s (p99 0.0066ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +113.3% | +274.0% | +5336.7% | +3032.7% |
| singleton_warm | +61.0% | +161.0% | +110.0% | +120.0% |
| transient | +54.0% | +160.0% | +74.0% | +80.7% |
| deep_graph | -8.2% | +72.7% | +45.5% | +45.5% |
| wide_graph | -0.0% | +72.7% | +37.3% | +45.5% |
| factory_deps | -19.0% | +28.6% | +4.8% | +4.8% |
| register_batch | -56.3% | -25.9% | +1738.8% | +3208.9% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -43.0% | -96.1% | -93.2% |
| singleton_warm | -38.3% | -23.3% | -26.8% |
| transient | -40.8% | -11.5% | -14.8% |
| deep_graph | -46.8% | -36.9% | -36.9% |
| wide_graph | -42.1% | -27.2% | -31.3% |
| factory_deps | -37.0% | -22.7% | -22.7% |
| register_batch | -40.9% | -97.6% | -98.7% |
| request_scope | N/A | N/A | -84.7% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.09M/s | 3.12M/s | 0.0003 | 0.0005 | ±4.89% | 24.5 | 4832169 |
| tsyringe | 1.76M/s | 1.78M/s | 0.0006 | 0.0010 | ±5.22% | 11.5 | 2722971 |
| inversify | 120.48K/s | 122.62K/s | 0.0082 | 0.0240 | ±54.63% | 4.4 | 115624 |
| awilix | 197.22K/s | 212.81K/s | 0.0047 | 0.0130 | ±6.01% | 14.1 | 342689 |
| baseline (new) | 6.64M/s | 6.67M/s | 0.0001 | 0.0003 | ±5.95% | 31.6 | 8719831 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.06M/s | 6.21M/s | 0.0002 | 0.0002 | ±0.05% | 25.9 | 17851163 |
| tsyringe | 3.76M/s | 3.83M/s | 0.0003 | 0.0003 | ±3.61% | 12.4 | 8669245 |
| inversify | 4.76M/s | 4.76M/s | 0.0002 | 0.0003 | ±2.91% | 18.4 | 10128656 |
| awilix | 4.50M/s | 4.55M/s | 0.0002 | 0.0003 | ±3.11% | 31.6 | 10332969 |
| baseline (new) | 9.84M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.05% | 0.5 | 28973207 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.22M/s | 4.33M/s | 0.0002 | 0.0003 | ±4.96% | 26.9 | 7300866 |
| tsyringe | 2.56M/s | 2.56M/s | 0.0004 | 0.0005 | ±3.05% | 20.4 | 5480936 |
| inversify | 3.80M/s | 3.83M/s | 0.0003 | 0.0003 | ±3.79% | 22.1 | 8340330 |
| awilix | 3.65M/s | 3.69M/s | 0.0003 | 0.0003 | ±2.27% | 36.3 | 9042628 |
| baseline (new) | 6.58M/s | 6.67M/s | 0.0001 | 0.0002 | ±1.85% | 26.3 | 15141913 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.46M/s | 9.90M/s | 0.0001 | 0.0001 | ±0.05% | 5.0 | 27761819 |
| tsyringe | 5.15M/s | 5.26M/s | 0.0002 | 0.0003 | ±2.39% | 2.2 | 12465993 |
| inversify | 6.17M/s | 6.25M/s | 0.0002 | 0.0002 | ±2.45% | 2.6 | 14262967 |
| awilix | 6.38M/s | 6.25M/s | 0.0002 | 0.0002 | ±3.77% | 3.7 | 15111426 |
| baseline (new) | 8.97M/s | 9.09M/s | 0.0001 | 0.0002 | ±19.27% | 9.5 | 22304226 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.17M/s | 9.09M/s | 0.0001 | 0.0001 | ±0.05% | 5.0 | 26971656 |
| tsyringe | 5.24M/s | 5.26M/s | 0.0002 | 0.0003 | ±2.17% | 2.8 | 12932633 |
| inversify | 6.48M/s | 6.62M/s | 0.0002 | 0.0002 | ±1.71% | 5.5 | 15985535 |
| awilix | 6.24M/s | 6.25M/s | 0.0002 | 0.0002 | ±3.79% | 3.0 | 12734580 |
| baseline (new) | 8.90M/s | 9.09M/s | 0.0001 | 0.0002 | ±2.92% | 0.4 | 15920374 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.97M/s | 5.88M/s | 0.0002 | 0.0002 | ±0.06% | 3.1 | 17556057 |
| tsyringe | 3.71M/s | 3.70M/s | 0.0003 | 0.0003 | ±3.36% | 1.9 | 7972300 |
| inversify | 4.51M/s | 4.55M/s | 0.0002 | 0.0003 | ±0.16% | 3.8 | 13271111 |
| awilix | 4.60M/s | 4.55M/s | 0.0002 | 0.0003 | ±2.96% | 2.5 | 9567813 |
| baseline (new) | 4.77M/s | 4.76M/s | 0.0002 | 0.0003 | ±2.76% | 4.3 | 12585879 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 452.40K/s | 461.89K/s | 0.0022 | 0.0039 | ±2.86% | 0.2 | 853828 |
| tsyringe | 267.55K/s | 272.78K/s | 0.0037 | 0.0061 | ±4.85% | 1.8 | 526368 |
| inversify | 10.46K/s | 10.99K/s | 0.0910 | 4.2107 | ±4.82% | 0.3 | 17852 |
| awilix | 5.84K/s | 6.11K/s | 0.1638 | 5.4693 | ±48.52% | 0.5 | 8152 |
| baseline (new) | 201.77K/s | 202.06K/s | 0.0049 | 0.0059 | ±1.20% | 7.8 | 590956 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.60M/s | 2.62M/s | 0.0004 | 0.0006 | ±3.83% | 0.1 | 4731261 |
| awilix | 380.03K/s | 402.41K/s | 0.0025 | 0.0066 | ±6.16% | 1.3 | 664048 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
