# @brushy/di-bench

Benchmark comparativo Tier 1: `@brushy/di-core` vs **tsyringe**, **InversifyJS**, **awilix** e **baseline** (`new` direto).

## Cenários

| ID | Descrição |
|----|-----------|
| `singleton_cold` | Register + 1º resolve (container novo por iteração) |
| `singleton_warm` | Resolve repetido com cache quente |
| `transient` | Nova instância a cada resolve |
| `deep_graph` | Cadeia A→B→C→D→E (5 níveis) |
| `wide_graph` | Serviço com 5 dependências paralelas |
| `factory_deps` | Factory com 2 dependências |
| `register_batch` | Registrar 50 providers |
| `request_scope` | Resolve scoped por iteração (brushy + awilix) |

## Métricas

Coletadas via [tinybench](https://github.com/tinylibs/tinybench) com `hrtimeNow`:

- Throughput mean / p50 (ops/s)
- Latência p50, p75, p99 (ms)
- Desvio padrão, margem de erro (rme)
- Derivadas: overhead vs baseline, diff vs brushy, ranking

## Como rodar

```bash
# Build di-core primeiro
npm run build -w @brushy/di-core

# Suite completa (~5 runs × 3s por task)
npm run bench -w @brushy/di-bench

# Smoke rápido (1 run, 1s)
npm run bench:quick -w @brushy/di-bench
```

## Variáveis de ambiente

| Env | Default | Descrição |
|-----|---------|-----------|
| `BENCH_TIME_MS` | `3000` | Duração de cada task |
| `BENCH_RUNS` | `5` | Runs completas da suite |
| `BENCH_SCENARIOS` | `all` | Filtro: `singleton_warm,transient` |
| `BENCH_LIBS` | `all` | Filtro: `brushy,tsyringe` |
| `BENCH_HISTORY` | `0` | Salvar snapshot em `results/history/` |

## Resultados

Após rodar, consulte:

- `results/latest.json` - dados brutos
- `results/latest.md` - relatório comparativo
- `results/latest.csv` - export para planilha

## Notas

- `request_scope`: tsyringe e inversify não têm escopo de requisição nativo (N/A).
- Rode em máquina idle, Node 20+, para números estáveis.
- Resultados são indicativos, não substituem profiling da sua app.
