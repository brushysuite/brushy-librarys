# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-09-14T00:55:52.051Z
- **Node:** v22.23.2
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 7763 64-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.03M/s | 1.81M/s | 127.80K/s | 217.01K/s | 6.67M/s |
| singleton_warm | 5.88M/s | 3.85M/s | 4.74M/s | 4.55M/s | 10.00M/s |
| transient | 4.00M/s | 2.62M/s | 3.57M/s | 3.45M/s | 6.67M/s |
| deep_graph | 9.90M/s | 5.26M/s | 6.25M/s | 6.67M/s | 11.11M/s |
| wide_graph | 10.00M/s | 5.00M/s | 5.88M/s | 6.25M/s | 9.09M/s |
| factory_deps | 5.85M/s | 3.83M/s | 4.35M/s | 4.74M/s | 5.00M/s |
| register_batch | 455.79K/s | 255.23K/s | 11.20K/s | 6.21K/s | 181.82K/s |
| request_scope | 2.70M/s | N/A | N/A | 402.58K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.03M/s (p99 0.0005ms) (+67.0% vs #2)
2. **tsyringe** - 1.81M/s (p99 0.0009ms)
3. **awilix** - 217.01K/s (p99 0.0107ms)
4. **inversify** - 127.80K/s (p99 0.0226ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0002ms) (+24.1% vs #2)
2. **inversify** - 4.74M/s (p99 0.0003ms)
3. **awilix** - 4.55M/s (p99 0.0003ms)
4. **tsyringe** - 3.85M/s (p99 0.0003ms)

### transient

1. **@brushy/di-core** 🥇 - 4.00M/s (p99 0.0003ms) (+12.0% vs #2)
2. **inversify** - 3.57M/s (p99 0.0003ms)
3. **awilix** - 3.45M/s (p99 0.0003ms)
4. **tsyringe** - 2.62M/s (p99 0.0004ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.90M/s (p99 0.0001ms) (+48.5% vs #2)
2. **awilix** - 6.67M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 5.26M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 10.00M/s (p99 0.0001ms) (+60.0% vs #2)
2. **awilix** - 6.25M/s (p99 0.0002ms)
3. **inversify** - 5.88M/s (p99 0.0002ms)
4. **tsyringe** - 5.00M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.85M/s (p99 0.0002ms) (+23.4% vs #2)
2. **awilix** - 4.74M/s (p99 0.0003ms)
3. **inversify** - 4.35M/s (p99 0.0003ms)
4. **tsyringe** - 3.83M/s (p99 0.0003ms)

### register_batch

1. **@brushy/di-core** 🥇 - 455.79K/s (p99 0.0031ms) (+78.6% vs #2)
2. **tsyringe** - 255.23K/s (p99 0.0060ms)
3. **inversify** - 11.20K/s (p99 4.5008ms)
4. **awilix** - 6.21K/s (p99 4.1029ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.70M/s (p99 0.0006ms) (+569.5% vs #2)
2. **awilix** - 402.58K/s (p99 0.0056ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +120.0% | +267.3% | +5116.7% | +2972.0% |
| singleton_warm | +70.0% | +160.0% | +111.0% | +120.0% |
| transient | +66.7% | +154.0% | +86.7% | +93.3% |
| deep_graph | +12.2% | +111.1% | +77.8% | +66.7% |
| wide_graph | -9.1% | +81.8% | +54.5% | +45.5% |
| factory_deps | -14.5% | +30.5% | +15.0% | +5.5% |
| register_batch | -60.1% | -28.8% | +1523.2% | +2828.7% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -40.1% | -95.8% | -92.8% |
| singleton_warm | -34.6% | -19.4% | -22.7% |
| transient | -34.4% | -10.7% | -13.8% |
| deep_graph | -46.8% | -36.9% | -32.7% |
| wide_graph | -50.0% | -41.2% | -37.5% |
| factory_deps | -34.5% | -25.7% | -19.0% |
| register_batch | -44.0% | -97.5% | -98.6% |
| request_scope | N/A | N/A | -85.1% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.02M/s | 3.03M/s | 0.0003 | 0.0005 | ±3.55% | 28.5 | 5793303 |
| tsyringe | 1.77M/s | 1.81M/s | 0.0006 | 0.0009 | ±2.60% | 12.4 | 3850085 |
| inversify | 125.61K/s | 127.80K/s | 0.0078 | 0.0226 | ±57.60% | 3.7 | 117145 |
| awilix | 212.38K/s | 217.01K/s | 0.0046 | 0.0107 | ±6.91% | 10.7 | 336182 |
| baseline (new) | 6.70M/s | 6.67M/s | 0.0001 | 0.0002 | ±4.04% | 33.3 | 11793739 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.99M/s | 5.88M/s | 0.0002 | 0.0002 | ±0.04% | 27.5 | 17652913 |
| tsyringe | 3.82M/s | 3.85M/s | 0.0003 | 0.0003 | ±2.66% | 10.2 | 10275622 |
| inversify | 4.69M/s | 4.74M/s | 0.0002 | 0.0003 | ±1.37% | 21.9 | 11833135 |
| awilix | 4.50M/s | 4.55M/s | 0.0002 | 0.0003 | ±4.18% | 22.7 | 9425782 |
| baseline (new) | 10.43M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.05% | 5.2 | 30661929 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.97M/s | 4.00M/s | 0.0003 | 0.0003 | ±2.10% | 31.6 | 9451304 |
| tsyringe | 2.61M/s | 2.62M/s | 0.0004 | 0.0004 | ±2.20% | 19.0 | 6171329 |
| inversify | 3.59M/s | 3.57M/s | 0.0003 | 0.0003 | ±1.26% | 29.3 | 9678226 |
| awilix | 3.44M/s | 3.45M/s | 0.0003 | 0.0003 | ±1.97% | 40.1 | 9352319 |
| baseline (new) | 6.73M/s | 6.67M/s | 0.0001 | 0.0002 | ±2.97% | 25.4 | 13401545 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.50M/s | 9.90M/s | 0.0001 | 0.0001 | ±0.05% | 4.8 | 27961148 |
| tsyringe | 5.16M/s | 5.26M/s | 0.0002 | 0.0003 | ±1.43% | 2.3 | 13596108 |
| inversify | 6.17M/s | 6.25M/s | 0.0002 | 0.0002 | ±2.54% | 2.7 | 13082427 |
| awilix | 6.77M/s | 6.67M/s | 0.0002 | 0.0002 | ±2.24% | 5.5 | 18284814 |
| baseline (new) | 11.53M/s | 11.11M/s | 0.0001 | 0.0001 | ±0.05% | 4.6 | 33797333 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.71M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.05% | 4.1 | 28603480 |
| tsyringe | 4.96M/s | 5.00M/s | 0.0002 | 0.0003 | ±1.54% | 2.7 | 13010597 |
| inversify | 5.89M/s | 5.88M/s | 0.0002 | 0.0002 | ±2.24% | 6.8 | 13171142 |
| awilix | 6.22M/s | 6.25M/s | 0.0002 | 0.0002 | ±1.87% | 3.6 | 15448781 |
| baseline (new) | 9.37M/s | 9.09M/s | 0.0001 | 0.0001 | ±3.43% | 4.7 | 16546558 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.76M/s | 5.85M/s | 0.0002 | 0.0002 | ±0.13% | 2.4 | 17006844 |
| tsyringe | 3.72M/s | 3.83M/s | 0.0003 | 0.0003 | ±1.55% | 1.7 | 9257169 |
| inversify | 4.31M/s | 4.35M/s | 0.0002 | 0.0003 | ±0.04% | 3.1 | 12753245 |
| awilix | 4.62M/s | 4.74M/s | 0.0002 | 0.0003 | ±1.43% | 1.8 | 12069534 |
| baseline (new) | 5.00M/s | 5.00M/s | 0.0002 | 0.0003 | ±0.05% | 2.8 | 14705979 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 449.01K/s | 455.79K/s | 0.0022 | 0.0031 | ±4.90% | 1.2 | 778137 |
| tsyringe | 250.64K/s | 255.23K/s | 0.0039 | 0.0060 | ±2.86% | 1.1 | 525357 |
| inversify | 10.79K/s | 11.20K/s | 0.0893 | 4.5008 | ±5.19% | 2.4 | 17521 |
| awilix | 5.97K/s | 6.21K/s | 0.1611 | 4.1029 | ±24.55% | 0.8 | 10918 |
| baseline (new) | 180.63K/s | 181.82K/s | 0.0055 | 0.0070 | ±0.76% | 0.5 | 531703 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.64M/s | 2.70M/s | 0.0004 | 0.0006 | ±2.28% | 1.2 | 5816163 |
| awilix | 385.20K/s | 402.58K/s | 0.0025 | 0.0056 | ±36.93% | 0.7 | 608882 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
