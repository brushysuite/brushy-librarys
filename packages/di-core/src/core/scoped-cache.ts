import { Token, InstanceWrapper } from "../types";
import { getActiveScope } from "../tools/request-scope-store";
import type { LifecycleCache } from "./strategies/lifecycle";

export const FALLBACK_SCOPE = Object.freeze({ brushy: "fallback" as const });

export function getScopeKey(): object {
  return getActiveScope() ?? FALLBACK_SCOPE;
}

export function getScopeBucket(
  cache: LifecycleCache,
): Map<Token, InstanceWrapper> {
  const key = getScopeKey();
  return getScopeBucketForKey(cache, key);
}

export function getScopeBucketForKey(
  cache: LifecycleCache,
  scopeKey: object,
): Map<Token, InstanceWrapper> {
  let bucket = cache.scoped.get(scopeKey);
  if (!bucket) {
    bucket = new Map();
    cache.scoped.set(scopeKey, bucket);
  }
  return bucket;
}

export function clearScopeBucket(cache: LifecycleCache, scope?: object): void {
  if (scope === undefined) {
    const active = getActiveScope();
    if (active) {
      cache.scoped.delete(active);
      return;
    }

    const fallback = cache.scoped.get(FALLBACK_SCOPE);
    if (fallback) {
      fallback.clear();
    }
    return;
  }

  cache.scoped.delete(scope);
}
