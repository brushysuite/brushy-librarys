export interface ParseTtlOptions {
  /**
   * How bare numeric strings (no unit suffix) are interpreted.
   * - `"ms"`: node-cache `stdTTL` style (`"60000"` → 60s)
   * - `"s"`: `set()` / `ttl()` style (`"60"` → 60s)
   */
  numericStringUnit?: "ms" | "s";
}

/** Unit suffix → seconds (fractional allowed for `ms`). */
const UNIT_TO_SECONDS: Record<string, number> = {
  ms: 1 / 1000,
  s: 1,
  m: 60,
  h: 3600,
  d: 86400,
};

const DURATION = /^(\d+(?:\.\d+)?)\s*(ms|s|m|h|d)?$/i;

/**
 * Parse TTL to seconds (node-cache compatible).
 *
 * - `number`: seconds (`0` = unlimited, `< 0` = expire on next access)
 * - `"35m"`, `"1h"`, `"500ms"`: duration shorthand (default unit `s` when omitted)
 * - bare `"60"`: seconds unless `numericStringUnit: "ms"` (for `stdTTL`)
 */
export function parseTtlToSeconds(
  ttl: number | string | undefined,
  fallbackSeconds: number,
  options: ParseTtlOptions = {},
): number {
  if (ttl === undefined) {
    return fallbackSeconds;
  }

  if (typeof ttl === "number") {
    return ttl;
  }

  const input = ttl.trim();
  if (input === "" || input === "0") {
    return 0;
  }

  const matched = DURATION.exec(input);
  if (matched) {
    const amount = Number(matched[1]);
    const unitSuffix = matched[2];

    if (!unitSuffix) {
      if (options.numericStringUnit === "ms") {
        return amount <= 0 ? 0 : amount / 1000;
      }
      return amount;
    }

    const factor = UNIT_TO_SECONDS[unitSuffix.toLowerCase()] ?? 1;
    return amount * factor;
  }

  return fallbackSeconds;
}

export function expireAtFromTtlSeconds(ttlSeconds: number, now = Date.now()): number {
  if (ttlSeconds === 0) {
    return 0;
  }
  if (ttlSeconds < 0) {
    return now;
  }
  return now + ttlSeconds * 1000;
}
