# Published benchmark results

This directory holds **committed** benchmark output from `@brushy/di-bench`. CI updates these files after every full suite run on `main`.

| File | Description |
| --- | --- |
| `BENCHMARK.md` | Human-readable report (same content as `latest.md`) |
| `latest.md` | Markdown report linked from package READMEs |
| `latest.json` | Raw aggregated metrics |
| `latest.csv` | Spreadsheet export |

## Regenerate locally

```bash
# Full suite (5 runs × 3s per task) — same as CI
npm run bench:report

# Quick smoke (1 run × 1s) — does not overwrite full latest.* when partial
npm run bench:quick
```

Partial or filtered runs write `partial-<timestamp>.*` (gitignored). Only full runs update `latest.*` and `BENCHMARK.md`.

Methodology: [`../METHODOLOGY.md`](../METHODOLOGY.md)
