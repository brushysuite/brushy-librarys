# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-10-05T13:59:11.831Z
- **Node:** v22.23.3
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 7763 64-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.12M/s | 1.81M/s | 127.96K/s | 219.83K/s | 6.67M/s |
| singleton_warm | 6.25M/s | 3.69M/s | 4.55M/s | 4.74M/s | 10.00M/s |
| transient | 4.33M/s | 2.70M/s | 3.70M/s | 3.56M/s | 6.67M/s |
| deep_graph | 9.09M/s | 5.24M/s | 6.25M/s | 6.62M/s | 9.09M/s |
| wide_graph | 9.90M/s | 5.00M/s | 6.25M/s | 6.25M/s | 9.09M/s |
| factory_deps | 5.88M/s | 3.57M/s | 4.33M/s | 4.74M/s | 5.00M/s |
| register_batch | 455.79K/s | 265.46K/s | 11.04K/s | 6.33K/s | 216.97K/s |
| request_scope | 2.62M/s | N/A | N/A | 396.04K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.12M/s (p99 0.0005ms) (+72.0% vs #2)
2. **tsyringe** - 1.81M/s (p99 0.0009ms)
3. **awilix** - 219.83K/s (p99 0.0087ms)
4. **inversify** - 127.96K/s (p99 0.0237ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 6.25M/s (p99 0.0002ms) (+31.9% vs #2)
2. **awilix** - 4.74M/s (p99 0.0003ms)
3. **inversify** - 4.55M/s (p99 0.0003ms)
4. **tsyringe** - 3.69M/s (p99 0.0003ms)

### transient

1. **@brushy/di-core** 🥇 - 4.33M/s (p99 0.0003ms) (+16.9% vs #2)
2. **inversify** - 3.70M/s (p99 0.0003ms)
3. **awilix** - 3.56M/s (p99 0.0003ms)
4. **tsyringe** - 2.70M/s (p99 0.0005ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+37.3% vs #2)
2. **awilix** - 6.62M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 5.24M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 9.90M/s (p99 0.0001ms) (+58.4% vs #2)
2. **awilix** - 6.25M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 5.00M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0002ms) (+24.1% vs #2)
2. **awilix** - 4.74M/s (p99 0.0003ms)
3. **inversify** - 4.33M/s (p99 0.0003ms)
4. **tsyringe** - 3.57M/s (p99 0.0003ms)

### register_batch

1. **@brushy/di-core** 🥇 - 455.79K/s (p99 0.0040ms) (+71.7% vs #2)
2. **tsyringe** - 265.46K/s (p99 0.0061ms)
3. **inversify** - 11.04K/s (p99 4.9431ms)
4. **awilix** - 6.33K/s (p99 4.6361ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.62M/s (p99 0.0007ms) (+562.7% vs #2)
2. **awilix** - 396.04K/s (p99 0.0057ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +114.0% | +268.0% | +5110.0% | +2932.7% |
| singleton_warm | +60.0% | +171.0% | +120.0% | +111.0% |
| transient | +54.0% | +147.3% | +80.0% | +87.3% |
| deep_graph | +0.0% | +73.6% | +45.5% | +37.3% |
| wide_graph | -8.2% | +81.8% | +45.5% | +45.5% |
| factory_deps | -15.0% | +40.0% | +15.5% | +5.5% |
| register_batch | -52.4% | -18.3% | +1865.7% | +3327.5% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -41.8% | -95.9% | -92.9% |
| singleton_warm | -41.0% | -27.3% | -24.2% |
| transient | -37.7% | -14.4% | -17.8% |
| deep_graph | -42.4% | -31.3% | -27.2% |
| wide_graph | -49.5% | -36.9% | -36.9% |
| factory_deps | -39.3% | -26.4% | -19.4% |
| register_batch | -41.8% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -84.9% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.06M/s | 3.12M/s | 0.0003 | 0.0005 | ±2.33% | 30.4 | 6677438 |
| tsyringe | 1.78M/s | 1.81M/s | 0.0006 | 0.0009 | ±3.97% | 12.4 | 3789039 |
| inversify | 124.84K/s | 127.96K/s | 0.0078 | 0.0237 | ±7.60% | 2.7 | 130875 |
| awilix | 212.82K/s | 219.83K/s | 0.0045 | 0.0087 | ±6.53% | 10.5 | 339354 |
| baseline (new) | 6.78M/s | 6.67M/s | 0.0001 | 0.0002 | ±3.26% | 32.4 | 13157948 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.34M/s | 6.25M/s | 0.0002 | 0.0002 | ±0.32% | 19.7 | 18574686 |
| tsyringe | 3.61M/s | 3.69M/s | 0.0003 | 0.0003 | ±1.97% | 17.8 | 9712039 |
| inversify | 4.58M/s | 4.55M/s | 0.0002 | 0.0003 | ±2.24% | 23.8 | 10543782 |
| awilix | 4.65M/s | 4.74M/s | 0.0002 | 0.0003 | ±1.22% | 30.4 | 12463709 |
| baseline (new) | 10.25M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.04% | 0.0 | 30156192 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.22M/s | 4.33M/s | 0.0002 | 0.0003 | ±1.40% | 30.7 | 10762469 |
| tsyringe | 2.64M/s | 2.70M/s | 0.0004 | 0.0005 | ±1.27% | 18.1 | 6851062 |
| inversify | 3.71M/s | 3.70M/s | 0.0003 | 0.0003 | ±1.36% | 23.2 | 9903211 |
| awilix | 3.53M/s | 3.56M/s | 0.0003 | 0.0003 | ±2.72% | 30.3 | 9314542 |
| baseline (new) | 6.74M/s | 6.67M/s | 0.0001 | 0.0002 | ±1.56% | 25.6 | 16126021 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.19M/s | 9.09M/s | 0.0001 | 0.0001 | ±0.04% | 0.0 | 27051369 |
| tsyringe | 5.13M/s | 5.24M/s | 0.0002 | 0.0003 | ±1.49% | 2.7 | 13854213 |
| inversify | 6.23M/s | 6.25M/s | 0.0002 | 0.0002 | ±1.10% | 4.4 | 15909376 |
| awilix | 6.41M/s | 6.62M/s | 0.0002 | 0.0002 | ±1.95% | 3.4 | 15716855 |
| baseline (new) | 9.28M/s | 9.09M/s | 0.0001 | 0.0002 | ±1.36% | 0.0 | 23055074 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.47M/s | 9.90M/s | 0.0001 | 0.0001 | ±0.04% | 4.6 | 27862078 |
| tsyringe | 5.02M/s | 5.00M/s | 0.0002 | 0.0003 | ±0.75% | 5.1 | 13947282 |
| inversify | 6.13M/s | 6.25M/s | 0.0002 | 0.0002 | ±1.95% | 4.6 | 14084532 |
| awilix | 6.12M/s | 6.25M/s | 0.0002 | 0.0002 | ±1.67% | 4.4 | 15557436 |
| baseline (new) | 9.10M/s | 9.09M/s | 0.0001 | 0.0002 | ±1.50% | 0.0 | 20886545 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.82M/s | 5.88M/s | 0.0002 | 0.0002 | ±0.04% | 0.3 | 17141070 |
| tsyringe | 3.57M/s | 3.57M/s | 0.0003 | 0.0003 | ±1.69% | 1.6 | 8794551 |
| inversify | 4.26M/s | 4.33M/s | 0.0002 | 0.0003 | ±0.05% | 3.5 | 12557379 |
| awilix | 4.61M/s | 4.74M/s | 0.0002 | 0.0003 | ±1.79% | 1.8 | 11429699 |
| baseline (new) | 5.00M/s | 5.00M/s | 0.0002 | 0.0002 | ±0.65% | 2.5 | 14662772 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 446.89K/s | 455.79K/s | 0.0022 | 0.0040 | ±2.88% | 0.7 | 843551 |
| tsyringe | 260.88K/s | 265.46K/s | 0.0038 | 0.0061 | ±1.19% | 1.5 | 695700 |
| inversify | 10.52K/s | 11.04K/s | 0.0906 | 4.9431 | ±88.96% | 0.5 | 8916 |
| awilix | 6.07K/s | 6.33K/s | 0.1580 | 4.6361 | ±4.61% | 1.2 | 12065 |
| baseline (new) | 214.95K/s | 216.97K/s | 0.0046 | 0.0055 | ±0.26% | 6.2 | 636577 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.58M/s | 2.62M/s | 0.0004 | 0.0007 | ±1.07% | 0.0 | 6647860 |
| awilix | 380.91K/s | 396.04K/s | 0.0025 | 0.0057 | ±49.64% | 0.2 | 576674 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
