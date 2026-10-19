# DI Benchmark Report

## Summary

- **@brushy/di** is #1 among DI runtimes in **8/8** scenarios (100%).
- Scenarios where @brushy/di is >5% behind #2: none.
- Baseline (`new` direct) is reported separately as theoretical lower bound, not ranked against DI libraries.

## Environment

- **Date:** 2026-10-19T12:33:00.926Z
- **Node:** v22.23.3
- **Platform:** linux (x64)
- **CPUs:** 4 × Intel(R) Xeon(R) Platinum 8370C CPU @ 2.80GHz
- **Config:** time=3000ms, runs=5

## Executive Summary (throughput p50)

| Scenario | di-core | tsyringe | inversify | awilix | baseline (new) |
|----------|----------|----------|----------|----------|----------|
| singleton_cold | 2.97M/s | 1.70M/s | 116.02K/s | 201.49K/s | 5.81M/s |
| singleton_warm | 5.52M/s | 3.42M/s | 4.26M/s | 4.18M/s | 10.20M/s |
| transient | 3.92M/s | 2.61M/s | 3.64M/s | 3.40M/s | 5.78M/s |
| deep_graph | 9.17M/s | 4.78M/s | 6.54M/s | 6.37M/s | 9.52M/s |
| wide_graph | 10.00M/s | 5.52M/s | 6.62M/s | 6.62M/s | 9.26M/s |
| factory_deps | 5.43M/s | 3.41M/s | 4.26M/s | 4.24M/s | 4.52M/s |
| register_batch | 396.67K/s | 250.69K/s | 10.81K/s | 5.79K/s | 224.37K/s |
| request_scope | 2.65M/s | N/A | N/A | 400.64K/s | N/A |

## DI Framework Ranking by Scenario

### singleton_cold

1. **@brushy/di-core** 🥇 - 2.97M/s (p99 0.0007ms) (+74.8% vs #2)
2. **tsyringe** - 1.70M/s (p99 0.0011ms)
3. **awilix** - 201.49K/s (p99 0.0098ms)
4. **inversify** - 116.02K/s (p99 0.0196ms)

### singleton_warm

1. **@brushy/di-core** 🥇 - 5.52M/s (p99 0.0003ms) (+29.8% vs #2)
2. **inversify** - 4.26M/s (p99 0.0005ms)
3. **awilix** - 4.18M/s (p99 0.0005ms)
4. **tsyringe** - 3.42M/s (p99 0.0006ms)

### transient

1. **@brushy/di-core** 🥇 - 3.92M/s (p99 0.0004ms) (+7.8% vs #2)
2. **inversify** - 3.64M/s (p99 0.0005ms)
3. **awilix** - 3.40M/s (p99 0.0005ms)
4. **tsyringe** - 2.61M/s (p99 0.0008ms)

### deep_graph

1. **@brushy/di-core** 🥇 - 9.17M/s (p99 0.0003ms) (+40.4% vs #2)
2. **inversify** - 6.54M/s (p99 0.0004ms)
3. **awilix** - 6.37M/s (p99 0.0004ms)
4. **tsyringe** - 4.78M/s (p99 0.0005ms)

### wide_graph

1. **@brushy/di-core** 🥇 - 10.00M/s (p99 0.0003ms) (+51.0% vs #2)
2. **awilix** - 6.62M/s (p99 0.0004ms)
3. **inversify** - 6.62M/s (p99 0.0004ms)
4. **tsyringe** - 5.52M/s (p99 0.0005ms)

### factory_deps

1. **@brushy/di-core** 🥇 - 5.43M/s (p99 0.0003ms) (+27.7% vs #2)
2. **inversify** - 4.26M/s (p99 0.0004ms)
3. **awilix** - 4.24M/s (p99 0.0004ms)
4. **tsyringe** - 3.41M/s (p99 0.0006ms)

### register_batch

1. **@brushy/di-core** 🥇 - 396.67K/s (p99 0.0039ms) (+58.2% vs #2)
2. **tsyringe** - 250.69K/s (p99 0.0057ms)
3. **inversify** - 10.81K/s (p99 3.2751ms)
4. **awilix** - 5.79K/s (p99 6.5195ms)

### request_scope

1. **@brushy/di-core** 🥇 - 2.65M/s (p99 0.0008ms) (+560.3% vs #2)
2. **awilix** - 400.64K/s (p99 0.0058ms)

## Overhead vs Baseline

| Scenario | brushy vs baseline | tsyringe vs baseline | inversify vs baseline | awilix |
|----------|----------------|----------------|----------------|----------------|
| singleton_cold | +95.9% | +242.4% | +4911.0% | +2785.5% |
| singleton_warm | +84.7% | +198.0% | +139.8% | +143.9% |
| transient | +47.4% | +121.4% | +59.0% | +69.9% |
| deep_graph | +3.8% | +99.0% | +45.7% | +49.5% |
| wide_graph | -7.4% | +67.6% | +39.8% | +39.8% |
| factory_deps | -16.7% | +32.6% | +6.3% | +6.8% |
| register_batch | -43.4% | -10.5% | +1974.6% | +3778.3% |
| request_scope | N/A | N/A | N/A | N/A |

## Brushy vs competitors

| Scenario | tsyringe vs brushy | inversify vs brushy | awilix vs brushy |
|----------|-------------------|---------------------|------------------|
| singleton_cold | -42.8% | -96.1% | -93.2% |
| singleton_warm | -38.0% | -23.0% | -24.3% |
| transient | -33.4% | -7.3% | -13.3% |
| deep_graph | -47.8% | -28.8% | -30.6% |
| wide_graph | -44.8% | -33.8% | -33.8% |
| factory_deps | -37.2% | -21.7% | -22.0% |
| register_batch | -36.8% | -97.3% | -98.5% |
| request_scope | N/A | N/A | -84.9% |

## Detailed Metrics

### singleton_cold

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.81M/s | 2.97M/s | 0.0003 | 0.0007 | ±3.93% | 25.8 | 4935177 |
| tsyringe | 1.61M/s | 1.70M/s | 0.0006 | 0.0011 | ±3.35% | 14.2 | 3181013 |
| inversify | 114.14K/s | 116.02K/s | 0.0086 | 0.0196 | ±47.50% | 2.8 | 91835 |
| awilix | 196.92K/s | 201.49K/s | 0.0050 | 0.0098 | ±52.35% | 12.9 | 269094 |
| baseline (new) | 5.70M/s | 5.81M/s | 0.0002 | 0.0003 | ±4.61% | 42.0 | 9316870 |

### singleton_warm

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.95M/s | 5.52M/s | 0.0002 | 0.0003 | ±2.00% | 33.3 | 16877310 |
| tsyringe | 3.27M/s | 3.42M/s | 0.0003 | 0.0006 | ±1.76% | 24.4 | 8445906 |
| inversify | 4.10M/s | 4.26M/s | 0.0002 | 0.0005 | ±2.84% | 28.3 | 8794673 |
| awilix | 4.04M/s | 4.18M/s | 0.0002 | 0.0005 | ±3.26% | 30.0 | 9814796 |
| baseline (new) | 9.81M/s | 10.20M/s | 0.0001 | 0.0002 | ±1.88% | 3.7 | 27836368 |

### transient

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 3.84M/s | 3.92M/s | 0.0003 | 0.0004 | ±3.32% | 29.2 | 7955649 |
| tsyringe | 2.50M/s | 2.61M/s | 0.0004 | 0.0008 | ±3.21% | 26.8 | 5249014 |
| inversify | 3.72M/s | 3.64M/s | 0.0003 | 0.0005 | ±2.34% | 35.9 | 9052850 |
| awilix | 3.28M/s | 3.40M/s | 0.0003 | 0.0005 | ±2.48% | 48.6 | 7998649 |
| baseline (new) | 5.82M/s | 5.78M/s | 0.0002 | 0.0003 | ±3.05% | 42.9 | 11487293 |

### deep_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 8.99M/s | 9.17M/s | 0.0001 | 0.0003 | ±0.04% | 5.6 | 25862221 |
| tsyringe | 4.79M/s | 4.78M/s | 0.0002 | 0.0005 | ±2.10% | 8.4 | 11638592 |
| inversify | 6.28M/s | 6.54M/s | 0.0002 | 0.0004 | ±2.26% | 4.6 | 13351829 |
| awilix | 6.05M/s | 6.37M/s | 0.0002 | 0.0004 | ±2.04% | 9.7 | 14263718 |
| baseline (new) | 9.33M/s | 9.52M/s | 0.0001 | 0.0003 | ±2.23% | 6.7 | 19607475 |

### wide_graph

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 9.59M/s | 10.00M/s | 0.0001 | 0.0003 | ±0.03% | 8.2 | 27308625 |
| tsyringe | 5.11M/s | 5.52M/s | 0.0002 | 0.0005 | ±0.88% | 1.7 | 13527441 |
| inversify | 6.36M/s | 6.62M/s | 0.0002 | 0.0004 | ±3.71% | 8.0 | 12215976 |
| awilix | 6.29M/s | 6.62M/s | 0.0002 | 0.0004 | ±1.79% | 6.2 | 15693783 |
| baseline (new) | 8.75M/s | 9.26M/s | 0.0001 | 0.0004 | ±2.88% | 8.5 | 19119589 |

### factory_deps

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 5.58M/s | 5.43M/s | 0.0002 | 0.0003 | ±0.03% | 3.5 | 16146820 |
| tsyringe | 3.29M/s | 3.41M/s | 0.0003 | 0.0006 | ±1.90% | 1.9 | 7760187 |
| inversify | 4.22M/s | 4.26M/s | 0.0002 | 0.0004 | ±0.03% | 2.2 | 12317232 |
| awilix | 4.06M/s | 4.24M/s | 0.0002 | 0.0004 | ±3.21% | 3.8 | 8607107 |
| baseline (new) | 4.38M/s | 4.52M/s | 0.0002 | 0.0004 | ±0.24% | 1.9 | 12660764 |

### register_batch

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 390.56K/s | 396.67K/s | 0.0025 | 0.0039 | ±3.19% | 1.4 | 755234 |
| tsyringe | 247.54K/s | 250.69K/s | 0.0040 | 0.0057 | ±4.72% | 1.0 | 368860 |
| inversify | 10.37K/s | 10.81K/s | 0.0925 | 3.2751 | ±4.12% | 2.0 | 19327 |
| awilix | 5.51K/s | 5.79K/s | 0.1729 | 6.5195 | ±84.87% | 0.5 | 5626 |
| baseline (new) | 222.06K/s | 224.37K/s | 0.0045 | 0.0051 | ±0.50% | 3.5 | 659143 |

### request_scope

| Lib | hz mean | hz p50 | p50 ms | p99 ms | rme | cv% | samples |
|-----|---------|--------|--------|--------|-----|-----|---------|
| @brushy/di-core | 2.52M/s | 2.65M/s | 0.0004 | 0.0008 | ±2.25% | 2.3 | 5490478 |
| awilix | 389.47K/s | 400.64K/s | 0.0025 | 0.0058 | ±4.82% | 1.4 | 760165 |

## Notes

- `request_scope`: tsyringe and inversify have no native request scope (N/A).
- Baseline measures direct `new` / property access without a container.
- DI ranking excludes baseline; ties declared within configured margin.
- Results are indicative; run on an idle machine for stable numbers.
