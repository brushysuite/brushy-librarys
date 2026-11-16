# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-11-16T15:11:33.088Z
- **Node:** v22.23.4
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 7763 64-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 3.12M/s | 1.81M/s | 124.61K/s | 217.91K/s | 6.67M/s |
| singleton_warm | 6.25M/s | 3.69M/s | 4.74M/s | 4.74M/s | 10.00M/s |
| transient | 4.35M/s | 2.70M/s | 3.85M/s | 3.56M/s | 6.67M/s |
| deep_graph | 9.09M/s | 5.26M/s | 5.88M/s | 6.62M/s | 9.09M/s |
| wide_graph | 9.09M/s | 5.24M/s | 5.88M/s | 6.25M/s | 9.09M/s |
| factory_deps | 6.25M/s | 3.57M/s | 4.35M/s | 4.74M/s | 5.24M/s |
| register_batch | 459.98K/s | 266.88K/s | 11.06K/s | 6.27K/s | 220.80K/s |
| request_scope | 2.49M/s | N/A | N/A | 397.77K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 3.12M/s (p99 0.0005ms) (+71.7% vs #2)
2. **tsyringe** - 1.81M/s (p99 0.0011ms)
3. **awilix** - 217.91K/s (p99 0.0091ms)
4. **inversify** - 124.61K/s (p99 0.0211ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 6.25M/s (p99 0.0002ms) (+31.9% vs #2)
2. **inversify** - 4.74M/s (p99 0.0003ms)
3. **awilix** - 4.74M/s (p99 0.0003ms)
4. **tsyringe** - 3.69M/s (p99 0.0005ms)

### transient

1. **@brushy/di-core** 🥇 - 4.35M/s (p99 0.0003ms) (+13.0% vs #2)
2. **inversify** - 3.85M/s (p99 0.0003ms)
3. **awilix** - 3.56M/s (p99 0.0005ms)
4. **tsyringe** - 2.70M/s (p99 0.0005ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+37.3% vs #2)
2. **awilix** - 6.62M/s (p99 0.0002ms)
3. **inversify** - 5.88M/s (p99 0.0002ms)
4. **tsyringe** - 5.26M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0002ms) (+45.5% vs #2)
2. **awilix** - 6.25M/s (p99 0.0002ms)
3. **inversify** - 5.88M/s (p99 0.0002ms)
4. **tsyringe** - 5.24M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 6.25M/s (p99 0.0003ms) (+31.9% vs #2)
2. **awilix** - 4.74M/s (p99 0.0004ms)
3. **inversify** - 4.35M/s (p99 0.0004ms)
4. **tsyringe** - 3.57M/s (p99 0.0004ms)

### register_batch

1. **@brushy/di-core** 🥇 - 459.98K/s (p99 0.0036ms) (+72.4% vs #2)
2. **tsyringe** - 266.88K/s (p99 0.0065ms)
3. **inversify** - 11.06K/s (p99 3.4698ms)
4. **awilix** - 6.27K/s (p99 5.1040ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.49M/s (p99 0.0007ms) (+526.9% vs #2)
2. **awilix** - 397.77K/s (p99 0.0061ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +114.0% | +267.3% | +5250.0% | +2959.3% |
| singleton_warm | +60.0% | +171.0% | +111.0% | +111.0% |
| transient | +53.3% | +147.3% | +73.3% | +87.3% |
| deep_graph | +0.0% | +72.7% | +54.5% | +37.3% |
| wide_graph | -0.0% | +73.6% | +54.5% | +45.5% |
| factory_deps | -16.2% | +46.6% | +20.4% | +10.5% |
| register_batch | -52.0% | -17.3% | +1896.0% | +3423.7% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -41.7% | -96.0% | -93.0% |
| singleton_warm | -41.0% | -24.2% | -24.2% |
| transient | -38.0% | -11.5% | -18.1% |
| deep_graph | -42.1% | -35.3% | -27.2% |
| wide_graph | -42.4% | -35.3% | -31.3% |
| factory_deps | -42.9% | -30.4% | -24.2% |
| register_batch | -42.0% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -84.0% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.07M/s | 3.12M/s | 0.0003 | 0.0005 | ±1.47% | 27.7 | 7435460 |
| tsyringe | 1.78M/s | 1.81M/s | 0.0006 | 0.0011 | ±3.60% | 13.3 | 3598061 |
| inversify | 122.22K/s | 124.61K/s | 0.0080 | 0.0211 | ±83.01% | 2.2 | 66426 |
| awilix | 213.02K/s | 217.91K/s | 0.0046 | 0.0091 | ±6.71% | 11.9 | 335578 |
| baseline (new) | 6.80M/s | 6.67M/s | 0.0001 | 0.0002 | ±3.23% | 32.3 | 12836945 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.29M/s | 6.25M/s | 0.0002 | 0.0002 | ±0.04% | 25.0 | 18539561 |
| tsyringe | 3.60M/s | 3.69M/s | 0.0003 | 0.0005 | ±3.13% | 14.8 | 8754711 |
| inversify | 4.65M/s | 4.74M/s | 0.0002 | 0.0003 | ±4.18% | 21.0 | 8459088 |
| awilix | 4.61M/s | 4.74M/s | 0.0002 | 0.0003 | ±1.63% | 26.0 | 11910184 |
| baseline (new) | 10.21M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.04% | 0.0 | 30093292 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.37M/s | 4.35M/s | 0.0002 | 0.0003 | ±3.15% | 29.3 | 9075747 |
| tsyringe | 2.64M/s | 2.70M/s | 0.0004 | 0.0005 | ±1.68% | 16.1 | 6570870 |
| inversify | 3.82M/s | 3.85M/s | 0.0003 | 0.0003 | ±2.01% | 18.5 | 9667063 |
| awilix | 3.54M/s | 3.56M/s | 0.0003 | 0.0005 | ±3.07% | 43.2 | 8245525 |
| baseline (new) | 6.79M/s | 6.67M/s | 0.0001 | 0.0002 | ±4.06% | 25.5 | 11543489 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.11M/s | 9.09M/s | 0.0001 | 0.0001 | ±0.05% | 5.4 | 26851636 |
| tsyringe | 5.28M/s | 5.26M/s | 0.0002 | 0.0003 | ±2.14% | 0.2 | 13446408 |
| inversify | 6.02M/s | 5.88M/s | 0.0002 | 0.0002 | ±3.14% | 6.7 | 11822684 |
| awilix | 6.44M/s | 6.62M/s | 0.0002 | 0.0002 | ±2.94% | 2.7 | 14347981 |
| baseline (new) | 9.29M/s | 9.09M/s | 0.0001 | 0.0002 | ±68.47% | 5.0 | 11885389 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.43M/s | 9.09M/s | 0.0001 | 0.0002 | ±1.94% | 4.4 | 27454482 |
| tsyringe | 5.10M/s | 5.24M/s | 0.0002 | 0.0003 | ±2.01% | 6.1 | 14093017 |
| inversify | 5.79M/s | 5.88M/s | 0.0002 | 0.0002 | ±1.28% | 8.9 | 14485758 |
| awilix | 6.28M/s | 6.25M/s | 0.0002 | 0.0002 | ±2.19% | 4.4 | 15027037 |
| baseline (new) | 9.06M/s | 9.09M/s | 0.0001 | 0.0002 | ±3.44% | 0.0 | 14531358 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 6.16M/s | 6.25M/s | 0.0002 | 0.0003 | ±0.15% | 2.7 | 18099935 |
| tsyringe | 3.56M/s | 3.57M/s | 0.0003 | 0.0004 | ±3.44% | 2.5 | 7084978 |
| inversify | 4.32M/s | 4.35M/s | 0.0002 | 0.0004 | ±0.05% | 3.6 | 12684572 |
| awilix | 4.64M/s | 4.74M/s | 0.0002 | 0.0004 | ±3.01% | 2.0 | 9575570 |
| baseline (new) | 5.08M/s | 5.24M/s | 0.0002 | 0.0003 | ±0.19% | 2.1 | 14920253 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 452.71K/s | 459.98K/s | 0.0022 | 0.0036 | ±3.27% | 1.6 | 825718 |
| tsyringe | 261.13K/s | 266.88K/s | 0.0037 | 0.0065 | ±2.81% | 2.6 | 510804 |
| inversify | 10.53K/s | 11.06K/s | 0.0904 | 3.4698 | ±4.18% | 1.0 | 19340 |
| awilix | 6.08K/s | 6.27K/s | 0.1596 | 5.1040 | ±32.09% | 0.8 | 9824 |
| baseline (new) | 204.31K/s | 220.80K/s | 0.0045 | 0.0099 | ±0.40% | 4.2 | 571920 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.49M/s | 2.49M/s | 0.0004 | 0.0007 | ±3.87% | 3.9 | 4558385 |
| awilix | 382.03K/s | 397.77K/s | 0.0025 | 0.0061 | ±6.77% | 1.2 | 625033 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
