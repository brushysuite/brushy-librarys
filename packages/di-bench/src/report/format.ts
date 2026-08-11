export function formatHz(hz: number): string {
  if (hz >= 1_000_000) return `${(hz / 1_000_000).toFixed(2)}M/s`;
  if (hz >= 1_000) return `${(hz / 1_000).toFixed(2)}K/s`;
  return `${hz.toFixed(0)}/s`;
}

export function nsToMs(ns: number): number {
  return ns / 1_000_000;
}

export function formatMs(ns: number): string {
  return `${nsToMs(ns).toFixed(4)}ms`;
}

export function formatPct(pct: number | undefined): string {
  if (pct === undefined) return "N/A";
  const sign = pct >= 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function pad(str: string, width: number): string {
  return str.length >= width ? str : str + " ".repeat(width - str.length);
}
