# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-11-09T15:36:03.112Z
- **Node:** v22.23.4
- **Platform:** linux (x64)
- **CPUs:** 4 × AMD EPYC 7763 64-Core Processor
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 2.94M/s | 1.75M/s | 128.12K/s | 212.81K/s | 6.67M/s |
| singleton_warm | 5.88M/s | 3.69M/s | 4.33M/s | 4.55M/s | 10.00M/s |
| transient | 4.17M/s | 2.62M/s | 3.69M/s | 3.56M/s | 6.67M/s |
| deep_graph | 9.09M/s | 4.98M/s | 6.25M/s | 6.62M/s | 9.09M/s |
| wide_graph | 9.01M/s | 4.76M/s | 6.25M/s | 6.25M/s | 9.09M/s |
| factory_deps | 5.88M/s | 3.56M/s | 4.33M/s | 4.52M/s | 5.00M/s |
| register_batch | 457.88K/s | 269.03K/s | 11.00K/s | 6.20K/s | 205.38K/s |
| request_scope | 2.56M/s | N/A | N/A | 397.77K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 2.94M/s (p99 0.0005ms) (+67.9% vs #2)
2. **tsyringe** - 1.75M/s (p99 0.0011ms)
3. **awilix** - 212.81K/s (p99 0.0091ms)
4. **inversify** - 128.12K/s (p99 0.0206ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0002ms) (+29.4% vs #2)
2. **awilix** - 4.55M/s (p99 0.0003ms)
3. **inversify** - 4.33M/s (p99 0.0003ms)
4. **tsyringe** - 3.69M/s (p99 0.0003ms)

### transient

1. **@brushy/di-core** 🥇 - 4.17M/s (p99 0.0003ms) (+12.9% vs #2)
2. **inversify** - 3.69M/s (p99 0.0003ms)
3. **awilix** - 3.56M/s (p99 0.0003ms)
4. **tsyringe** - 2.62M/s (p99 0.0005ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.09M/s (p99 0.0001ms) (+37.3% vs #2)
2. **awilix** - 6.62M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 4.98M/s (p99 0.0003ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 9.01M/s (p99 0.0001ms) (+44.1% vs #2)
2. **awilix** - 6.25M/s (p99 0.0002ms)
3. **inversify** - 6.25M/s (p99 0.0002ms)
4. **tsyringe** - 4.76M/s (p99 0.0003ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.88M/s (p99 0.0002ms) (+30.0% vs #2)
2. **awilix** - 4.52M/s (p99 0.0003ms)
3. **inversify** - 4.33M/s (p99 0.0003ms)
4. **tsyringe** - 3.56M/s (p99 0.0004ms)

### register_batch

1. **@brushy/di-core** 🥇 - 457.88K/s (p99 0.0036ms) (+70.2% vs #2)
2. **tsyringe** - 269.03K/s (p99 0.0061ms)
3. **inversify** - 11.00K/s (p99 3.2136ms)
4. **awilix** - 6.20K/s (p99 5.3587ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.56M/s (p99 0.0006ms) (+544.6% vs #2)
2. **awilix** - 397.77K/s (p99 0.0058ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +126.7% | +280.7% | +5103.3% | +3032.7% |
| singleton_warm | +70.0% | +171.0% | +131.0% | +120.0% |
| transient | +60.0% | +154.0% | +80.7% | +87.3% |
| deep_graph | +0.0% | +82.7% | +45.5% | +37.3% |
| wide_graph | +0.9% | +90.9% | +45.5% | +45.5% |
| factory_deps | -15.0% | +40.5% | +15.5% | +10.5% |
| register_batch | -55.1% | -23.7% | +1766.5% | +3211.4% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -40.5% | -95.6% | -92.8% |
| singleton_warm | -37.3% | -26.4% | -22.7% |
| transient | -37.0% | -11.4% | -14.6% |
| deep_graph | -45.3% | -31.3% | -27.2% |
| wide_graph | -47.1% | -30.6% | -30.6% |
| factory_deps | -39.5% | -26.4% | -23.1% |
| register_batch | -41.2% | -97.6% | -98.6% |
| request_scope | N/A | N/A | -84.5% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.92M/s | 2.94M/s | 0.0003 | 0.0005 | ±4.53% | 29.8 | 4838182 |
| tsyringe | 1.73M/s | 1.75M/s | 0.0006 | 0.0011 | ±4.85% | 13.6 | 2945840 |
| inversify | 125.18K/s | 128.12K/s | 0.0078 | 0.0206 | ±108.15% | 2.2 | 49929 |
| awilix | 205.00K/s | 212.81K/s | 0.0047 | 0.0091 | ±6.83% | 13.6 | 321573 |
| baseline (new) | 6.75M/s | 6.67M/s | 0.0001 | 0.0003 | ±4.45% | 27.3 | 11172083 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.96M/s | 5.88M/s | 0.0002 | 0.0002 | ±0.38% | 21.3 | 17566400 |
| tsyringe | 3.60M/s | 3.69M/s | 0.0003 | 0.0003 | ±3.50% | 15.7 | 9268004 |
| inversify | 4.28M/s | 4.33M/s | 0.0002 | 0.0003 | ±3.51% | 24.9 | 8743683 |
| awilix | 4.52M/s | 4.55M/s | 0.0002 | 0.0003 | ±3.16% | 26.6 | 10376570 |
| baseline (new) | 9.66M/s | 10.00M/s | 0.0001 | 0.0001 | ±0.27% | 0.0 | 28453007 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 4.19M/s | 4.17M/s | 0.0002 | 0.0003 | ±2.68% | 27.4 | 9369540 |
| tsyringe | 2.57M/s | 2.62M/s | 0.0004 | 0.0005 | ±3.77% | 21.7 | 5116679 |
| inversify | 3.67M/s | 3.69M/s | 0.0003 | 0.0003 | ±2.07% | 18.5 | 9317434 |
| awilix | 3.53M/s | 3.56M/s | 0.0003 | 0.0003 | ±2.42% | 29.5 | 8716181 |
| baseline (new) | 6.55M/s | 6.67M/s | 0.0001 | 0.0002 | ±4.81% | 25.7 | 10136853 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.40M/s | 9.09M/s | 0.0001 | 0.0001 | ±1.74% | 0.0 | 27469897 |
| tsyringe | 4.88M/s | 4.98M/s | 0.0002 | 0.0003 | ±2.67% | 0.3 | 11711148 |
| inversify | 6.24M/s | 6.25M/s | 0.0002 | 0.0002 | ±4.19% | 2.7 | 10498834 |
| awilix | 6.42M/s | 6.62M/s | 0.0002 | 0.0002 | ±3.45% | 0.3 | 13613706 |
| baseline (new) | 9.33M/s | 9.09M/s | 0.0001 | 0.0002 | ±3.25% | 4.7 | 18615556 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.69M/s | 9.01M/s | 0.0001 | 0.0001 | ±0.04% | 3.6 | 25639207 |
| tsyringe | 4.77M/s | 4.76M/s | 0.0002 | 0.0003 | ±1.08% | 2.0 | 12953919 |
| inversify | 6.34M/s | 6.25M/s | 0.0002 | 0.0002 | ±5.53% | 5.4 | 10808614 |
| awilix | 6.32M/s | 6.25M/s | 0.0002 | 0.0002 | ±2.53% | 2.7 | 14740532 |
| baseline (new) | 8.91M/s | 9.09M/s | 0.0001 | 0.0002 | ±3.57% | 0.0 | 17900069 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.96M/s | 5.88M/s | 0.0002 | 0.0002 | ±0.05% | 2.5 | 17600333 |
| tsyringe | 3.53M/s | 3.56M/s | 0.0003 | 0.0004 | ±3.78% | 1.4 | 6789406 |
| inversify | 4.28M/s | 4.33M/s | 0.0002 | 0.0003 | ±0.11% | 3.6 | 12639058 |
| awilix | 4.45M/s | 4.52M/s | 0.0002 | 0.0003 | ±1.13% | 3.1 | 11511635 |
| baseline (new) | 5.07M/s | 5.00M/s | 0.0002 | 0.0003 | ±2.23% | 2.5 | 14719548 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 448.33K/s | 457.88K/s | 0.0022 | 0.0036 | ±3.39% | 0.9 | 862882 |
| tsyringe | 263.78K/s | 269.03K/s | 0.0037 | 0.0061 | ±3.18% | 3.2 | 495108 |
| inversify | 10.39K/s | 11.00K/s | 0.0909 | 3.2136 | ±41.93% | 3.3 | 15522 |
| awilix | 6.01K/s | 6.20K/s | 0.1612 | 5.3587 | ±4.99% | 1.0 | 11504 |
| baseline (new) | 203.91K/s | 205.38K/s | 0.0049 | 0.0059 | ±0.83% | 5.0 | 599421 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.55M/s | 2.56M/s | 0.0004 | 0.0006 | ±2.73% | 1.3 | 5311287 |
| awilix | 384.58K/s | 397.77K/s | 0.0025 | 0.0058 | ±28.31% | 1.4 | 671975 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
