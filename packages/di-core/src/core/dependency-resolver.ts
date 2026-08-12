import { Token, ProviderConfig } from "../types";
import { DependencyError } from "./dependency-error";
import { DependencyRegistry, type ProviderRecord } from "./dependency-registry";
import { Logger } from "./logger";
import { PromiseCache } from "./promise-cache";
import {
  createLifecycleCache,
  LifecycleCache,
  resolveLifecycleStrategy,
} from "./strategies/lifecycle";
import { createFromProvider } from "./strategies/provider";
import { DEFAULT_PROMISE_TTL, isNodeDev } from "./constants";
import { clearScopeBucket, getScopeBucket, getScopeBucketForKey } from "./scoped-cache";

const EMPTY_CONTEXT = new Map<Token, unknown>();
const FAST_MISS = Symbol("brushyFastMiss");

/**
 * Resolves dependencies using strategy arrays - zero React imports.
 */
export class DependencyResolver {
  private _lifecycleCache: LifecycleCache | null = null;
  private promiseCache: PromiseCache | null = null;
  private _resolving: Set<Token> | null = null;
  private _resolvingStack: Token[] | null = null;
  private dependencyGraph: Map<Token, Set<Token>> | null = null;
  private _asyncResolvingPromises: Map<Token, Promise<unknown>> | null = null;
  private observables: Map<Token, { unsubscribe: () => void }> | null = null;
  private resolveFn: ((token: Token) => unknown) | null = null;
  private graphPrinted = false;
  private readonly debug: boolean;

  private get lifecycleCache(): LifecycleCache {
    return (this._lifecycleCache ??= createLifecycleCache());
  }

  private get resolving(): Set<Token> {
    return (this._resolving ??= new Set());
  }

  private set resolving(value: Set<Token>) {
    this._resolving = value;
  }

  private get resolvingStack(): Token[] {
    return (this._resolvingStack ??= []);
  }

  private set resolvingStack(value: Token[]) {
    this._resolvingStack = value;
  }

  private get asyncResolvingPromises(): Map<Token, Promise<unknown>> {
    return (this._asyncResolvingPromises ??= new Map());
  }

  private set asyncResolvingPromises(value: Map<Token, Promise<unknown>>) {
    this._asyncResolvingPromises = value;
  }

  private getPromiseCache(): PromiseCache {
    if (!this.promiseCache) this.promiseCache = new PromiseCache();
    return this.promiseCache;
  }

  private getDependencyGraph(): Map<Token, Set<Token>> {
    if (!this.dependencyGraph) this.dependencyGraph = new Map();
    return this.dependencyGraph;
  }

  private getObservables(): Map<Token, { unsubscribe: () => void }> {
    if (!this.observables) this.observables = new Map();
    return this.observables;
  }

  private getResolveFn(): (token: Token) => unknown {
    if (!this.resolveFn) {
      this.resolveFn = (token) => this.resolve(token);
    }
    return this.resolveFn;
  }

  constructor(
    private readonly registry: DependencyRegistry,
    debug = false,
  ) {
    this.debug = debug;
    if (debug) {
      Logger.setEnabled(true);
      Logger.info("Debug mode: enabled");
    }
  }

  resolveWithRecord<T>(token: Token, record: ProviderRecord): T {
    const fast = this.tryFastResolveFromRecord<T>(token, record);
    if (fast !== FAST_MISS) return fast;

    if (this.resolving.has(token)) {
      throw new DependencyError(
        `Circular dependency detected: ${[...this.resolving].map(String).join(" -> ")} -> ${String(token)}`,
      );
    }

    this.resolving.add(token);
    try {
      return this.resolveInstance<T>(token, undefined, record);
    } finally {
      this.resolving.delete(token);
    }
  }

  resolve<T>(token: Token, context?: Map<Token, unknown>): T {
    const record = !context && !this.debug ? this.registry.getRecord(token) : undefined;

    if (record && !context && !this.debug) {
      return this.resolveWithRecord<T>(token, record);
    }

    if (!context && !this.debug) {
      const fast = this.tryFastResolve<T>(token);
      if (fast !== FAST_MISS) return fast;
    }

    if (this.resolving.has(token)) {
      throw new DependencyError(
        `Circular dependency detected: ${[...this.resolving].map(String).join(" -> ")} -> ${String(token)}`,
      );
    }

    this.resolving.add(token);
    try {
      const result = this.resolveInstance<T>(token, context);
      if (this.debug && !this.graphPrinted) {
        Logger.debug(
          `Resolved ${Logger.formatToken(this.formatToken(token))} synchronously`,
        );
        this.printDependencyGraph();
        this.graphPrinted = true;
      }
      return result;
    } finally {
      this.resolving.delete(token);
    }
  }

  resolveInScope<T>(
    token: Token,
    scopeKey: object,
    bucket?: Map<Token, { instance: unknown; lastUsed: number }>,
  ): T {
    if (!this.debug) {
      const fast = this.tryFastResolveInScope<T>(token, scopeKey, bucket);
      if (fast !== FAST_MISS) return fast;
    }

    if (this.resolving.has(token)) {
      throw new DependencyError(
        `Circular dependency detected: ${[...this.resolving].map(String).join(" -> ")} -> ${String(token)}`,
      );
    }

    this.resolving.add(token);
    try {
      return this.resolveInstanceInScope<T>(token, scopeKey);
    } finally {
      this.resolving.delete(token);
    }
  }

  async resolveAsync<T>(token: Token, context?: Map<Token, unknown>): Promise<T> {
    const result = await this.resolveInstanceAsync<T>(token, context);
    if (this.debug) {
      Logger.debug(
        `Resolved ${Logger.formatToken(this.formatToken(token))} asynchronously`,
      );
      this.printDependencyGraph();
    }
    return result;
  }

  getCachedPromise<T>(
    token: Token,
    methodName: string,
    args: unknown[] = [],
  ): Promise<T> {
    const instance = this.resolve(token) as Record<string, unknown>;
    const method = instance?.[methodName];

    if (typeof method !== "function") {
      throw new DependencyError(
        `Cannot call method '${methodName}' on token '${String(token)}'`,
      );
    }

    const key = this.createPromiseCacheKey(token, methodName, args);
    const cached = this.getPromiseCache().get<T>(key);
    if (cached) {
      if (this.debug) {
        Logger.debug(
          `Using cached promise for ${Logger.formatToken(this.formatToken(token))}.${methodName}()`,
        );
      }
      return cached;
    }

    if (this.debug) {
      Logger.debug(
        `Creating new promise for ${Logger.formatToken(this.formatToken(token))}.${methodName}()`,
      );
    }

    const promise = (method as (...a: unknown[]) => Promise<T>).apply(
      instance,
      args,
    );
    const config = this.getConfig(token);
    this.getPromiseCache().set(key, promise, config?.promiseTtl ?? DEFAULT_PROMISE_TTL);
    return promise;
  }

  clearPromiseCache(): void {
    this.promiseCache?.clear();
    if (this.debug) Logger.debug("Promise cache cleared");
  }

  clearTokenPromiseCache(token: Token): void {
    this.promiseCache?.clear(token);
    if (this.debug) {
      Logger.debug(
        `Promise cache cleared for ${Logger.formatToken(this.formatToken(token))}`,
      );
    }
  }

  clearRequestScope(): void {
    clearScopeBucket(this.lifecycleCache);
  }

  clearScopedInstances(scopeKey: object): void {
    clearScopeBucket(this.lifecycleCache, scopeKey);
  }

  getOrCreateScopeBucket(
    scopeKey: object,
  ): Map<Token, { instance: unknown; lastUsed: number }> {
    return getScopeBucketForKey(this.lifecycleCache, scopeKey);
  }

  invalidateCache(token: Token): void {
    if (this._lifecycleCache?.immutable.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Skipping invalidation for immutable instance: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return;
    }

    this._lifecycleCache?.singletons.delete(token);
    const record = this.registry.getRecord(token);
    if (record) {
      record.singletonWrapper = undefined;
      record.cached = undefined;
      record.isCached = false;
    }
    this.observables?.delete(token);
    this.invalidateDependents(token);
  }

  private ensureSingletonCacheSynced(): void {
    const cache = this.lifecycleCache;
    for (const token of this.registry.getAllTokens()) {
      const record = this.registry.getRecord(token);
      if (
        !record ||
        !record.isCached ||
        !record.isSingleton ||
        cache.singletons.has(token)
      ) {
        continue;
      }
      const stored = { instance: record.cached, lastUsed: 0 };
      cache.singletons.set(token, stored);
      record.singletonWrapper = stored;
    }
  }

  getInstances(): IterableIterator<[Token, { instance: unknown; lastUsed: number }]> {
    this.ensureSingletonCacheSynced();
    return this.lifecycleCache.singletons.entries();
  }

  deleteInstance(token: Token): void {
    if (this._lifecycleCache?.immutable.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Skipping deletion for immutable instance: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return;
    }

    this._lifecycleCache?.singletons.delete(token);
    const record = this.registry.getRecord(token);
    if (record) {
      record.singletonWrapper = undefined;
      record.cached = undefined;
      record.isCached = false;
    }
    this.observables?.get(token)?.unsubscribe?.();
    this.observables?.delete(token);
  }

  get instances(): Map<Token, { instance: unknown; lastUsed: number }> {
    this.ensureSingletonCacheSynced();
    return this.lifecycleCache.singletons;
  }

  get requestScopeInstances(): Map<Token, { instance: unknown; lastUsed: number }> {
    return getScopeBucket(this.lifecycleCache);
  }

  get immutableInstances(): Map<Token, unknown> {
    return this.lifecycleCache.immutable;
  }

  private resolveInstance<T>(
    token: Token,
    context?: Map<Token, unknown>,
    record?: ProviderRecord,
  ): T {
    const config = record?.config ?? this.getConfig(token);
    if (!config) {
      throw new DependencyError(`Token not registered: ${String(token)}`);
    }

    if (config.useValue !== undefined) {
      return this.handleDirectValue<T>(token, config);
    }

    this.checkCircularDependency(token);

    const localContext = context ?? EMPTY_CONTEXT;

    if (localContext.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Returning from resolution context: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return localContext.get(token) as T;
    }

    const cached = this.getFromCache<T>(token, config);
    if (cached !== undefined) return cached;

    const resolvedRecord = record ?? this.registry.getRecord(token);
    const creator = resolvedRecord
      ? this.registry.ensureCreator(resolvedRecord)
      : undefined;
    return this.createAndStore<T>(token, config, creator);
  }

  private async resolveInstanceAsync<T>(
    token: Token,
    context?: Map<Token, unknown>,
  ): Promise<T> {
    const localContext = context ?? EMPTY_CONTEXT;

    if (localContext.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Returning from resolution context: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return localContext.get(token) as T;
    }

    const scopedCached = this.getInstanceFromRequestScope(token);
    if (scopedCached) return scopedCached.instance as T;

    const singletonCached = this.lifecycleCache.singletons.get(token);
    if (singletonCached) return singletonCached.instance as T;

    const config = this.getConfig(token);
    if (!config) {
      throw new DependencyError(`Dependency '${String(token)}' not registered.`);
    }

    this.checkCircularDependency(token);

    if (this.asyncResolvingPromises.has(token)) {
      return this.asyncResolvingPromises.get(token) as Promise<T>;
    }

    this.resolvingStack.push(token);

    try {
      try {
        const resolvingPromise = (async () => {
          const instance = await this.createInstanceAsync(config);
          if (!instance) {
            throw new DependencyError(`Failed to instantiate '${String(token)}'.`);
          }
          this.storeInstance(token, instance, config);
          this.trackDependencies(token, config);
          this.registerObservable(token, config);
          return instance as T;
        })();

        this.asyncResolvingPromises.set(token, resolvingPromise);
        return await resolvingPromise;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        throw new DependencyError(
          `Failed to resolve dependency '${String(token)}'. Error: ${message}`,
        );
      }
    } finally {
      this.resolvingStack.pop();
      this.asyncResolvingPromises.delete(token);
    }
  }

  private handleDirectValue<T>(token: Token, config: ProviderConfig): T {
    if (this.debug) {
      Logger.debug(
        `Using direct value for ${Logger.formatToken(this.formatToken(token))}`,
      );
    }
    return config.useValue as T;
  }

  private getFromCache<T>(
    token: Token,
    config?: ProviderConfig,
  ): T | undefined {
    const resolvedConfig = config ?? this.getConfig(token);
    const immutable = this.lifecycleCache.immutable.get(token);
    if (immutable !== undefined) {
      if (this.debug) {
        Logger.debug(
          `Returning from immutable cache: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return immutable as T;
    }

    if (!resolvedConfig) return undefined;

    const strategy = resolveLifecycleStrategy(resolvedConfig.lifecycle);
    const fromSingleton = strategy.get(
      this.lifecycleCache,
      token,
      resolvedConfig.ttl,
    );
    if (fromSingleton !== undefined) {
      if (this.debug) {
        Logger.debug(
          `Returning from singleton cache: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return fromSingleton as T;
    }

    const scoped = this.getInstanceFromRequestScope(token);
    if (scoped) {
      if (this.debug) {
        Logger.debug(
          `Returning from request scope: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return scoped.instance as T;
    }

    return undefined;
  }

  private createAndStore<T>(
    token: Token,
    config: ProviderConfig,
    creator?: (resolve: (token: Token) => unknown) => unknown,
  ): T {
    this.resolvingStack.push(token);

    let instance: T;
    try {
      if (this.debug) this.logInstanceCreation(this.formatToken(token), config);
      instance = this.createInstance<T>(config, creator);
      if (!instance) {
        throw new DependencyError(`Failed to instantiate '${String(token)}'.`);
      }
      if (this.debug) {
        Logger.debug(
          `Successfully created instance of ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(
        `Failed to resolve ${Logger.formatToken(this.formatToken(token))}: ${message}`,
      );
      throw new DependencyError(
        `Failed to resolve dependency '${String(token)}'. Error: ${message}`,
      );
    } finally {
      this.resolvingStack.pop();
    }

    this.storeInstance(token, instance, config);
    if (this.debug) this.trackDependencies(token, config);
    this.registerObservable(token, config);
    return instance;
  }

  private createInstance<T>(
    config: ProviderConfig,
    creator?: (resolve: (token: Token) => unknown) => unknown,
  ): T {
    if (this.debug) {
      if (config.useClass) {
        Logger.debug(`Creating using class: ${Logger.formatClass(config.useClass.name)}`);
      } else if (config.useFactory) {
        Logger.debug("Creating using factory");
      }
    }

    return createFromProvider<T>(config, this.getResolveFn(), creator);
  }

  private async createInstanceAsync(config: ProviderConfig): Promise<unknown> {
    if (config.useValue !== undefined) return config.useValue;

    if (config.useFactory) {
      const deps = await this.resolveDependenciesForFactoryAsync(config);
      return config.useFactory(...deps);
    }

    if (!config.useClass) {
      throw new DependencyError("Invalid provider config.");
    }

    if (!config.dependencies?.length) return new config.useClass();

    const deps = await Promise.all(
      config.dependencies.map((dep) => this.resolveAsync(dep)),
    );
    return new config.useClass(...deps);
  }

  private async resolveDependenciesForFactoryAsync(
    config: ProviderConfig,
  ): Promise<unknown[]> {
    if (!config.dependencies?.length) return [];
    return Promise.all(config.dependencies.map((dep) => this.resolveAsync(dep)));
  }

  private resolveDependenciesForFactory(config: ProviderConfig): unknown[] {
    if (!config.dependencies?.length) return [];
    return config.dependencies.map((dep) => {
      const resolved = this.resolve(dep);
      if (this.debug) {
        Logger.debug(
          `Resolved factory dependency ${this.formatToken(dep)} (${(resolved as { constructor?: { name?: string } })?.constructor?.name ?? "unknown"})`,
        );
      }
      return resolved;
    });
  }

  private storeInstance(
    token: Token,
    instance: unknown,
    config: ProviderConfig,
  ): void {
    const strategy = resolveLifecycleStrategy(config.lifecycle);
    if (strategy.skipsStorage) return;
    strategy.set(this.lifecycleCache, token, instance, config.ttl);

    const record = this.registry.getRecord(token);
    if (
      record &&
      record.isSingleton &&
      !record.hasTtl &&
      !record.isCached
    ) {
      record.singletonWrapper = { instance, lastUsed: 0 };
      record.cached = instance;
      record.isCached = true;
    }

    if (this.debug && config.lifecycle === "immutable") {
      Logger.debug(
        `Stored immutable instance for ${Logger.formatToken(this.formatToken(token))}`,
      );
    }
  }

  private tryFastResolve<T>(token: Token): T | typeof FAST_MISS {
    const record = this.registry.getRecord(token);
    if (!record) return FAST_MISS;
    return this.tryFastResolveFromRecord<T>(token, record);
  }

  private resolveWithCreator<T>(
    record: ProviderRecord,
    resolve?: (token: Token) => unknown,
  ): T | typeof FAST_MISS {
    if (record.useClass && !record.hasDeps) {
      return new record.useClass() as T;
    }

    const factory = record.config.useFactory;
    if (typeof factory === "function" && !record.hasDeps) {
      return factory() as T;
    }

    const resolveDep = resolve ?? this.getResolveFn();

    // Fast arity paths without allocating a compiled creator on cold create.
    if (typeof factory === "function") {
      const deps = record.config.dependencies!;
      switch (deps.length) {
        case 1:
          return factory(resolveDep(deps[0]!)) as T;
        case 2:
          return factory(resolveDep(deps[0]!), resolveDep(deps[1]!)) as T;
        default:
          break;
      }
    }

    if (record.useClass) {
      const deps = record.config.dependencies!;
      const ClassRef = record.useClass;
      switch (deps.length) {
        case 1:
          return new ClassRef(resolveDep(deps[0]!)) as T;
        case 2:
          return new ClassRef(resolveDep(deps[0]!), resolveDep(deps[1]!)) as T;
        case 3:
          return new ClassRef(
            resolveDep(deps[0]!),
            resolveDep(deps[1]!),
            resolveDep(deps[2]!),
          ) as T;
        case 4:
          return new ClassRef(
            resolveDep(deps[0]!),
            resolveDep(deps[1]!),
            resolveDep(deps[2]!),
            resolveDep(deps[3]!),
          ) as T;
        case 5:
          return new ClassRef(
            resolveDep(deps[0]!),
            resolveDep(deps[1]!),
            resolveDep(deps[2]!),
            resolveDep(deps[3]!),
            resolveDep(deps[4]!),
          ) as T;
        default:
          break;
      }
    }

    const creator = this.registry.ensureCreator(record);
    if (!creator) return FAST_MISS;
    return creator(resolveDep) as T;
  }

  private tryFastResolveFromRecord<T>(
    token: Token,
    record: ProviderRecord,
  ): T | typeof FAST_MISS {
    if (record.isUseValue) {
      return record.config.useValue as T;
    }

    if (record.isImmutable) {
      const cache = this.lifecycleCache;
      const cached = cache.immutable.get(token);
      if (cached !== undefined) return cached as T;
      const instance = this.resolveWithCreator(record);
      if (instance === FAST_MISS) return FAST_MISS;
      cache.immutable.set(token, instance);
      return instance as T;
    }

    if (record.isSingleton && !record.hasTtl) {
      if (record.isCached) {
        return record.cached as T;
      }
      const instance = this.resolveWithCreator(record);
      if (instance === FAST_MISS) return FAST_MISS;
      record.cached = instance;
      record.isCached = true;
      // Keep Map in sync only when the lifecycle cache was already materialized
      // (GC / inspection). Avoid allocating Map+wrapper on cold first resolve.
      if (this._lifecycleCache) {
        const stored = { instance, lastUsed: 0 };
        this._lifecycleCache.singletons.set(token, stored);
        record.singletonWrapper = stored;
      }
      return instance as T;
    }

    if (record.isScoped) {
      const bucket = getScopeBucket(this.lifecycleCache);
      const wrapper = bucket.get(token);
      if (wrapper) return wrapper.instance as T;
      const instance = this.resolveWithCreator(record);
      if (instance === FAST_MISS) return FAST_MISS;
      bucket.set(token, { instance, lastUsed: 0 });
      return instance as T;
    }

    if (record.isTransient) {
      return this.resolveWithCreator(record) as T;
    }

    return FAST_MISS;
  }

  private tryFastResolveInScope<T>(
    token: Token,
    scopeKey: object,
    bucket?: Map<Token, { instance: unknown; lastUsed: number }>,
  ): T | typeof FAST_MISS {
    const record = this.registry.getRecord(token);
    if (!record) return FAST_MISS;

    if (record.isUseValue) {
      return record.config.useValue as T;
    }

    if (record.isScoped) {
      const scopeBucket =
        bucket ?? getScopeBucketForKey(this.lifecycleCache, scopeKey);
      const wrapper = scopeBucket.get(token);
      if (wrapper) return wrapper.instance as T;
      const instance = this.resolveWithCreator(
        record,
        (dep) => this.resolveInScope(dep, scopeKey, scopeBucket),
      );
      if (instance === FAST_MISS) return FAST_MISS;
      scopeBucket.set(token, { instance, lastUsed: 0 });
      return instance as T;
    }

    return this.tryFastResolve<T>(token);
  }

  private resolveInstanceInScope<T>(
    token: Token,
    scopeKey: object,
    bucket?: Map<Token, { instance: unknown; lastUsed: number }>,
  ): T {
    const record = this.registry.getRecord(token);
    const config = record?.config;
    if (!config) {
      throw new DependencyError(`Token not registered: ${String(token)}`);
    }

    if (config.useValue !== undefined) {
      return this.handleDirectValue<T>(token, config);
    }

    if (config.lifecycle === "scoped") {
      const scopeBucket =
        bucket ?? getScopeBucketForKey(this.lifecycleCache, scopeKey);
      const cached = scopeBucket.get(token);
      if (cached) return cached.instance as T;

      this.checkCircularDependency(token);
      const instance = this.createInstance<T>(
        config,
        this.registry.ensureCreator(record),
      );
      scopeBucket.set(token, { instance, lastUsed: 0 });
      if (this.debug) this.trackDependencies(token, config);
      return instance;
    }

    return this.resolveInstance<T>(token);
  }

  private getInstanceFromRequestScope(token: Token) {
    return getScopeBucket(this.lifecycleCache).get(token);
  }

  private trackDependencies(token: Token, config: ProviderConfig): void {
    if (!config.dependencies?.length) {
      if (this.debug) {
        Logger.debug(
          `No dependencies defined for ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return;
    }

    if (this.debug) {
      Logger.debug(
        `Tracking dependencies for ${Logger.formatToken(this.formatToken(token))}...`,
      );
    }

    const graph = this.getDependencyGraph();
    for (const dependency of config.dependencies) {
      if (!graph.has(dependency)) {
        graph.set(dependency, new Set());
      }
      graph.get(dependency)!.add(token);
      if (this.debug) {
        Logger.debug(
          `Tracking dependency: ${Logger.formatToken(this.formatToken(token))} -> ${Logger.formatToken(this.formatToken(dependency))}`,
        );
      }
    }
  }

  private invalidateDependents(token: Token): void {
    const dependents = this.dependencyGraph?.get(token);
    if (!dependents) return;
    for (const dependent of dependents) this.invalidateCache(dependent);
  }

  private checkCircularDependency(token: Token): void {
    if (!this.resolvingStack.includes(token)) return;
    throw new DependencyError(
      `Circular dependency detected: ${this.resolvingStack.map(String).join(" -> ")} -> ${String(token)}`,
    );
  }

  private registerObservable(token: Token, config: ProviderConfig): void {
    if (!config.observable) return;
    this.getObservables().set(token, { unsubscribe: config.observable.unsubscribe });
  }

  private getConfig(token: Token): ProviderConfig | undefined {
    return this.registry.getProvider(token);
  }

  private logInstanceCreation(tokenName: string, config: ProviderConfig): void {
    Logger.debug(`Creating instance of ${Logger.formatToken(tokenName)}`);
    if (!config.dependencies?.length) return;
    Logger.debug(
      `Dependencies for ${Logger.formatToken(tokenName)}: ${config.dependencies.map((d) => this.formatToken(d)).join(", ")}`,
    );
  }

  private formatToken(token: Token): string {
    if (typeof token === "symbol") return token.toString().slice(7, -1);
    return String(token);
  }

  private createPromiseCacheKey(
    token: Token,
    methodName: string,
    args: unknown[],
  ): string {
    return this.getPromiseCache().createKey(token, methodName, args);
  }

  private isPromiseCacheExpired(cachedItem: {
    expiresAt: number;
  }): boolean {
    return Date.now() > cachedItem.expiresAt;
  }

  private getTokenInfo(token: Token): string {
    const config = this.getConfig(token);
    if (!config) return "not registered";

    if (config.useValue !== undefined) {
      const value = config.useValue;
      if (typeof value === "function") {
        const fn = value as Function & { displayName?: string; name?: string };
        const name = fn.displayName || fn.name || "Component";
        const isComponent = Boolean(fn.displayName) || /^[A-Z]/.test(name);
        return isComponent
          ? `${Logger.formatClass(name)} (${Logger.formatType("ReactComponent")})`
          : `${Logger.formatClass(name)} (${Logger.formatType("Function")})`;
      }
      const typeName = value?.constructor?.name || typeof value;
      return `${Logger.formatClass(typeName)} (${Logger.formatType("Value")})`;
    }

    if (config.useClass) {
      const instance = this.lifecycleCache.singletons.get(token)?.instance;
      const className = instance
        ? (instance as { constructor: { name: string } }).constructor.name
        : config.useClass.name;
      return `${Logger.formatClass(className)} (${Logger.formatLifecycle(config.lifecycle ?? "singleton")})`;
    }

    if (config.useFactory) {
      return `${Logger.formatClass("Factory")} (${Logger.formatLifecycle(config.lifecycle ?? "singleton")})`;
    }

    return "unknown";
  }

  private printDependencyGraph(): void {
    if (this.graphPrinted && isNodeDev()) return;
    if (!this.dependencyGraph?.size) {
      Logger.warn("No dependencies tracked yet");
      return;
    }
    this.printRegisteredTokens();
    this.printDependencyRelationships();
    this.printCachedInstances();
  }

  private printRegisteredTokens(): void {
    Logger.info("Registered Tokens:");
    const tokens = new Set<Token>(this.registry.getAllTokens());
    for (const [dependency, dependents] of this.dependencyGraph ?? []) {
      tokens.add(dependency);
      for (const dependent of dependents) tokens.add(dependent);
    }
    for (const token of tokens) {
      Logger.debug(
        `• ${Logger.formatToken(this.formatToken(token))}: ${this.getTokenInfo(token)}`,
      );
    }
  }

  private printDependencyRelationships(): void {
    Logger.info("Dependency Relationships:");
    for (const [dependency, dependents] of this.dependencyGraph ?? []) {
      const depName = this.formatToken(dependency);
      const implInfo = this.getTokenInfo(dependency);
      if (!dependents.size) {
        Logger.debug(`• ${depName} (${implInfo}) - No dependents`);
        continue;
      }
      const dependentsStr = [...dependents]
        .map((d) => `${this.formatToken(d)} (${this.getTokenInfo(d)})`)
        .join(", ");
      Logger.debug(`• ${depName} (${implInfo}) ← Used by: ${dependentsStr}`);
    }
  }

  private printCachedInstances(): void {
    Logger.info("Cached Instances:");
    const count = this.instances.size + this.immutableInstances.size;
    if (!count) {
      Logger.debug("No cached instances.");
      return;
    }

    for (const [token, instance] of this.immutableInstances) {
      const className = (instance as { constructor: { name: string } }).constructor.name;
      Logger.debug(
        `• ${Logger.formatToken(this.formatToken(token))} (${Logger.formatClass(className)}) - Immutable`,
      );
    }

    for (const [token, wrapper] of this.instances) {
      const className = (wrapper.instance as { constructor: { name: string } }).constructor.name;
      Logger.debug(
        `• ${Logger.formatToken(this.formatToken(token))} (${Logger.formatClass(className)}) - Last used: ${new Date(wrapper.lastUsed).toLocaleTimeString()}`,
      );
    }
  }
}
