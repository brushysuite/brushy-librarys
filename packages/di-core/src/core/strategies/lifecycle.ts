import { InstanceWrapper, ProviderConfig, Token } from "../../types";

export type LifecycleType = NonNullable<ProviderConfig["lifecycle"]>;

export interface LifecycleCache {
  singletons: Map<Token, InstanceWrapper>;
  scoped: Map<Token, InstanceWrapper>;
  immutable: Map<Token, unknown>;
}

export interface LifecycleStrategy {
  readonly type: LifecycleType;
  get(cache: LifecycleCache, token: Token, ttl?: number): unknown | undefined;
  set(
    cache: LifecycleCache,
    token: Token,
    instance: unknown,
    ttl?: number,
  ): void;
  readonly skipsStorage: boolean;
}

const now = () => Date.now();

const isExpired = (wrapper: InstanceWrapper, ttl?: number) =>
  !!ttl && now() - wrapper.lastUsed > ttl;

const singletonStrategy: LifecycleStrategy = {
  type: "singleton",
  skipsStorage: false,
  get(cache, token, ttl) {
    const wrapper = cache.singletons.get(token);
    if (!wrapper) return undefined;
    if (ttl) {
      if (isExpired(wrapper, ttl)) {
        cache.singletons.delete(token);
        return undefined;
      }
      wrapper.lastUsed = now();
    }
    return wrapper.instance;
  },
  set(cache, token, instance, _ttl) {
    cache.singletons.set(token, { instance, lastUsed: now() });
  },
};

const scopedStrategy: LifecycleStrategy = {
  type: "scoped",
  skipsStorage: false,
  get(cache, token) {
    const wrapper = cache.scoped.get(token);
    return wrapper?.instance;
  },
  set(cache, token, instance) {
    cache.scoped.set(token, { instance, lastUsed: now() });
  },
};

const immutableStrategy: LifecycleStrategy = {
  type: "immutable",
  skipsStorage: false,
  get(cache, token) {
    return cache.immutable.get(token);
  },
  set(cache, token, instance) {
    cache.immutable.set(token, instance);
  },
};

const transientStrategy: LifecycleStrategy = {
  type: "transient",
  skipsStorage: true,
  get: () => undefined,
  set: () => {},
};

export const LIFECYCLE_STRATEGIES: Record<LifecycleType, LifecycleStrategy> = {
  singleton: singletonStrategy,
  scoped: scopedStrategy,
  immutable: immutableStrategy,
  transient: transientStrategy,
};

export const resolveLifecycleStrategy = (
  lifecycle?: LifecycleType,
): LifecycleStrategy =>
  LIFECYCLE_STRATEGIES[lifecycle ?? "singleton"] ?? singletonStrategy;

export const createLifecycleCache = (): LifecycleCache => ({
  singletons: new Map(),
  scoped: new Map(),
  immutable: new Map(),
});
