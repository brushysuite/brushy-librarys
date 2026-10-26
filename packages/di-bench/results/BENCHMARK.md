# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-10-26T12:29:43.877Z
- **Node:** v22.23.3
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 9V74 80-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 4.33M/s | 2.38M/s | 141.84K/s | 268.38K/s | 9.01M/s |
| singleton_warm | 7.69M/s | 4.76M/s | 5.56M/s | 6.21M/s | 11.11M/s |
| transient | 5.88M/s | 3.57M/s | 4.76M/s | 5.00M/s | 8.33M/s |
| deep_graph | 11.11M/s | 6.62M/s | 7.69M/s | 7.69M/s | 12.50M/s |
| wide_graph | 11.11M/s | 6.25M/s | 7.69M/s | 7.69M/s | 11.11M/s |
| factory_deps | 7.63M/s | 4.55M/s | 5.26M/s | 5.88M/s | 6.67M/s |
| register_batch | 525.49K/s | 315.96K/s | 12.54K/s | 7.55K/s | 260.69K/s |
| request_scope | 3.57M/s | N/A | N/A | 499.25K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 4.33M/s (p99 0.0004ms) (+82.3% vs #2)
2. **tsyringe** - 2.38M/s (p99 0.0007ms)
3. **awilix** - 268.38K/s (p99 0.0071ms)
4. **inversify** - 141.84K/s (p99 0.0160ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 7.69M/s (p99 0.0002ms) (+23.8% vs #2)
2. **awilix** - 6.21M/s (p99 0.0003ms)
3. **inversify** - 5.56M/s (p99 0.0003ms)
4. **tsyringe** - 4.76M/s (p99 0.0003ms)

### transient

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0002ms) (+17.6% vs #2)
2. **awilix** - 5.00M/s (p99 0.0003ms)
3. **inversify** - 4.76M/s (p99 0.0003ms)
4. **tsyringe** - 3.57M/s (p99 0.0004ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 11.11M/s (p99 0.0001ms) (+44.4% vs #2)
2. **awilix** - 7.69M/s (p99 0.0002ms)
3. **inversify** - 7.69M/s (p99 0.0002ms)
4. **tsyringe** - 6.62M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 11.11M/s (p99 0.0001ms) (+44.4% vs #2)
2. **awilix** - 7.69M/s (p99 0.0002ms)
3. **inversify** - 7.69M/s (p99 0.0002ms)
4. **tsyringe** - 6.25M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 7.63M/s (p99 0.0002ms) (+29.8% vs #2)
2. **awilix** - 5.88M/s (p99 0.0003ms)
3. **inversify** - 5.26M/s (p99 0.0003ms)
4. **tsyringe** - 4.55M/s (p99 0.0003ms)

### register_batch

1. **@brushy/di-core** 🥇 - 525.49K/s (p99 0.0029ms) (+66.3% vs #2)
2. **tsyringe** - 315.96K/s (p99 0.0042ms)
3. **inversify** - 12.54K/s (p99 6.8738ms)
4. **awilix** - 7.55K/s (p99 7.7979ms)

### request_scope

1. **@brushy/di-core** 🥇 - 3.57M/s (p99 0.0005ms) (+615.4% vs #2)
2. **awilix** - 499.25K/s (p99 0.0048ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +108.1% | +279.3% | +6251.4% | +3256.8% |
| singleton_warm | +44.4% | +133.3% | +100.0% | +78.9% |
| transient | +41.7% | +133.3% | +75.0% | +66.7% |
| deep_graph | +12.5% | +88.7% | +62.5% | +62.5% |
| wide_graph | +0.0% | +77.8% | +44.4% | +44.4% |
| factory_deps | -12.7% | +46.7% | +26.7% | +13.3% |
| register_batch | -50.4% | -17.5% | +1979.2% | +3352.6% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -45.1% | -96.7% | -93.8% |
| singleton_warm | -38.1% | -27.8% | -19.3% |
| transient | -39.3% | -19.0% | -15.0% |
| deep_graph | -40.4% | -30.8% | -30.8% |
| wide_graph | -43.8% | -30.8% | -30.8% |
| factory_deps | -40.5% | -31.1% | -22.9% |
| register_batch | -39.9% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -86.0% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.17M/s | 4.33M/s | 0.0002 | 0.0004 | ±4.89% | 26.9 | 6089721 |
| tsyringe | 2.27M/s | 2.38M/s | 0.0004 | 0.0007 | ±3.18% | 15.4 | 4288031 |
| inversify | 140.13K/s | 141.84K/s | 0.0070 | 0.0160 | ±101.89% | 3.3 | 46666 |
| awilix | 260.81K/s | 268.38K/s | 0.0037 | 0.0071 | ±7.75% | 12.5 | 347101 |
| baseline (new) | 8.67M/s | 9.01M/s | 0.0001 | 0.0002 | ±5.58% | 25.8 | 10945576 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 7.72M/s | 7.69M/s | 0.0001 | 0.0002 | ±0.20% | 17.5 | 22743240 |
| tsyringe | 4.76M/s | 4.76M/s | 0.0002 | 0.0003 | ±2.20% | 16.6 | 11823819 |
| inversify | 5.64M/s | 5.56M/s | 0.0002 | 0.0003 | ±3.36% | 20.6 | 10818194 |
| awilix | 6.00M/s | 6.21M/s | 0.0002 | 0.0003 | ±5.40% | 25.3 | 10888498 |
| baseline (new) | 11.62M/s | 11.11M/s | 0.0001 | 0.0001 | ±0.27% | 0.0 | 34156903 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.79M/s | 5.88M/s | 0.0002 | 0.0002 | ±3.45% | 27.5 | 10962782 |
| tsyringe | 3.53M/s | 3.57M/s | 0.0003 | 0.0004 | ±4.81% | 19.4 | 5803364 |
| inversify | 4.82M/s | 4.76M/s | 0.0002 | 0.0003 | ±4.00% | 17.3 | 10082031 |
| awilix | 4.90M/s | 5.00M/s | 0.0002 | 0.0003 | ±3.13% | 21.8 | 11467089 |
| baseline (new) | 8.56M/s | 8.33M/s | 0.0001 | 0.0002 | ±3.15% | 27.5 | 16835096 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 10.76M/s | 11.11M/s | 0.0001 | 0.0001 | ±0.03% | 0.0 | 31676689 |
| tsyringe | 6.34M/s | 6.62M/s | 0.0002 | 0.0003 | ±1.06% | 3.3 | 16925976 |
| inversify | 7.75M/s | 7.69M/s | 0.0001 | 0.0002 | ±2.48% | 0.0 | 15860649 |
| awilix | 7.87M/s | 7.69M/s | 0.0001 | 0.0002 | ±1.82% | 3.7 | 19236395 |
| baseline (new) | 12.47M/s | 12.50M/s | 0.0001 | 0.0002 | ±4.18% | 0.0 | 20002287 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 11.48M/s | 11.11M/s | 0.0001 | 0.0001 | ±0.03% | 6.2 | 33846294 |
| tsyringe | 6.32M/s | 6.25M/s | 0.0002 | 0.0003 | ±1.62% | 3.2 | 16878671 |
| inversify | 7.64M/s | 7.69M/s | 0.0001 | 0.0002 | ±5.22% | 6.5 | 10560406 |
| awilix | 7.50M/s | 7.69M/s | 0.0001 | 0.0002 | ±3.32% | 6.5 | 15602982 |
| baseline (new) | 11.28M/s | 11.11M/s | 0.0001 | 0.0002 | ±5.02% | 5.5 | 12689331 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 7.42M/s | 7.63M/s | 0.0001 | 0.0002 | ±0.18% | 3.1 | 21892398 |
| tsyringe | 4.48M/s | 4.55M/s | 0.0002 | 0.0003 | ±3.53% | 3.2 | 8424715 |
| inversify | 5.17M/s | 5.26M/s | 0.0002 | 0.0003 | ±0.04% | 3.7 | 15292050 |
| awilix | 5.72M/s | 5.88M/s | 0.0002 | 0.0003 | ±3.90% | 4.0 | 10115021 |
| baseline (new) | 6.52M/s | 6.67M/s | 0.0001 | 0.0003 | ±0.34% | 0.0 | 19100927 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 518.40K/s | 525.49K/s | 0.0019 | 0.0029 | ±5.99% | 1.4 | 676674 |
| tsyringe | 312.06K/s | 315.96K/s | 0.0032 | 0.0042 | ±2.25% | 2.0 | 692634 |
| inversify | 12.12K/s | 12.54K/s | 0.0798 | 6.8738 | ±7.17% | 3.4 | 14951 |
| awilix | 7.32K/s | 7.55K/s | 0.1324 | 7.7979 | ±7.11% | 1.3 | 10838 |
| baseline (new) | 258.00K/s | 260.69K/s | 0.0038 | 0.0049 | ±0.32% | 2.4 | 766237 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.48M/s | 3.57M/s | 0.0003 | 0.0005 | ±6.76% | 3.1 | 3852633 |
| awilix | 480.39K/s | 499.25K/s | 0.0020 | 0.0048 | ±12.01% | 2.9 | 826514 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
