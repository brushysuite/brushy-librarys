import { Token, ProviderConfig } from "../types";
import { DependencyError } from "./dependency-error";
import { DependencyRegistry } from "./dependency-registry";
import { Logger } from "./logger";
import { PromiseCache } from "./promise-cache";
import {
  createLifecycleCache,
  LifecycleCache,
  resolveLifecycleStrategy,
} from "./strategies/lifecycle";
import { createFromProvider, ResolveFn } from "./strategies/provider";
import { DEFAULT_PROMISE_TTL } from "./constants";

const EMPTY_CONTEXT = new Map<Token, unknown>();
const FAST_MISS = Symbol("brushyFastMiss");

/**
 * Resolves dependencies using strategy arrays — zero React imports.
 */
export class DependencyResolver {
  private readonly lifecycleCache: LifecycleCache = createLifecycleCache();
  private readonly promiseCache = new PromiseCache();
  private readonly resolving = new Set<Token>();
  private readonly resolvingStack: Token[] = [];
  private readonly dependencyGraph = new Map<Token, Set<Token>>();
  private readonly asyncResolvingPromises = new Map<Token, Promise<unknown>>();
  private readonly observables = new Map<Token, { unsubscribe: () => void }>();
  private graphPrinted = false;
  private readonly debug: boolean;

  constructor(
    private readonly registry: DependencyRegistry,
    debug = false,
  ) {
    this.debug = debug;
    Logger.setEnabled(debug);
    if (debug) Logger.info("Debug mode: enabled");
  }

  resolve<T>(token: Token, context?: Map<Token, unknown>): T {
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
    const cached = this.promiseCache.get<T>(key);
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
    this.promiseCache.set(key, promise, config?.promiseTtl ?? DEFAULT_PROMISE_TTL);
    return promise;
  }

  clearPromiseCache(): void {
    this.promiseCache.clear();
    if (this.debug) Logger.debug("Promise cache cleared");
  }

  clearTokenPromiseCache(token: Token): void {
    this.promiseCache.clear(token);
    if (this.debug) {
      Logger.debug(
        `Promise cache cleared for ${Logger.formatToken(this.formatToken(token))}`,
      );
    }
  }

  clearRequestScope(): void {
    this.lifecycleCache.scoped.clear();
  }

  invalidateCache(token: Token): void {
    if (this.lifecycleCache.immutable.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Skipping invalidation for immutable instance: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return;
    }

    this.lifecycleCache.singletons.delete(token);
    this.observables.delete(token);
    this.invalidateDependents(token);
  }

  getInstances(): IterableIterator<[Token, { instance: unknown; lastUsed: number }]> {
    return this.lifecycleCache.singletons.entries();
  }

  deleteInstance(token: Token): void {
    if (this.lifecycleCache.immutable.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Skipping deletion for immutable instance: ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return;
    }

    this.lifecycleCache.singletons.delete(token);
    this.observables.get(token)?.unsubscribe?.();
    this.observables.delete(token);
  }

  get instances(): Map<Token, { instance: unknown; lastUsed: number }> {
    return this.lifecycleCache.singletons;
  }

  get requestScopeInstances(): Map<Token, { instance: unknown; lastUsed: number }> {
    return this.lifecycleCache.scoped;
  }

  get immutableInstances(): Map<Token, unknown> {
    return this.lifecycleCache.immutable;
  }

  private resolveInstance<T>(token: Token, context?: Map<Token, unknown>): T {
    const config = this.getConfig(token);
    if (!config) {
      throw new DependencyError(`Token não registrado: ${String(token)}`);
    }

    if (config.useValue !== undefined) {
      return this.handleDirectValue<T>(token, config);
    }

    this.checkCircularDependency(token);

    const localContext = context ?? EMPTY_CONTEXT;
    const tokenName = this.formatToken(token);

    if (localContext.has(token)) {
      if (this.debug) {
        Logger.debug(
          `Returning from resolution context: ${Logger.formatToken(tokenName)}`,
        );
      }
      return localContext.get(token) as T;
    }

    const cached = this.getFromCache<T>(token, tokenName, config);
    if (cached !== undefined) return cached;

    return this.createAndStore<T>(token, config, tokenName);
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
    tokenName: string,
    config?: ProviderConfig,
  ): T | undefined {
    const resolvedConfig = config ?? this.getConfig(token);
    const immutable = this.lifecycleCache.immutable.get(token);
    if (immutable !== undefined) {
      if (this.debug) {
        Logger.debug(
          `Returning from immutable cache: ${Logger.formatToken(tokenName)}`,
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
          `Returning from singleton cache: ${Logger.formatToken(tokenName)}`,
        );
      }
      return fromSingleton as T;
    }

    const scoped = this.getInstanceFromRequestScope(token);
    if (scoped) {
      if (this.debug) {
        Logger.debug(
          `Returning from request scope: ${Logger.formatToken(tokenName)}`,
        );
      }
      return scoped.instance as T;
    }

    return undefined;
  }

  private createAndStore<T>(
    token: Token,
    config: ProviderConfig,
    tokenName: string,
  ): T {
    this.resolvingStack.push(token);

    let instance: T;
    try {
      if (this.debug) this.logInstanceCreation(tokenName, config);
      instance = this.createInstance<T>(config);
      if (!instance) {
        throw new DependencyError(`Failed to instantiate '${String(token)}'.`);
      }
      if (this.debug) {
        Logger.debug(
          `Successfully created instance of ${Logger.formatToken(tokenName)}`,
        );
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      Logger.error(
        `Failed to resolve ${Logger.formatToken(tokenName)}: ${message}`,
      );
      throw new DependencyError(
        `Failed to resolve dependency '${String(token)}'. Error: ${message}`,
      );
    } finally {
      this.resolvingStack.pop();
    }

    this.storeInstance(token, instance, config);
    this.trackDependencies(token, config);
    this.registerObservable(token, config);
    return instance;
  }

  private createInstance<T>(config: ProviderConfig): T {
    if (this.debug) {
      if (config.useClass) {
        Logger.debug(`Creating using class: ${Logger.formatClass(config.useClass.name)}`);
      } else if (config.useFactory) {
        Logger.debug("Creating using factory");
      }
    }

    if (config.useValue !== undefined) return config.useValue as T;

    if (config.useFactory) {
      const deps = this.resolveDependenciesForFactory(config);
      return config.useFactory(...deps) as T;
    }

    if (config.useClass) {
      const deps = (config.dependencies ?? []).map((dep) => this.resolve(dep));
      return deps.length
        ? (new config.useClass(...deps) as T)
        : (new config.useClass() as T);
    }

    throw new DependencyError("Invalid provider config.");
  }

  private async createInstanceAsync(config: ProviderConfig): Promise<unknown> {
    if (config.useFactory) return config.useFactory();
    if (!config.useClass) {
      throw new DependencyError(`Invalid provider config for '${String(config)}'.`);
    }
    if (!config.dependencies?.length) return new config.useClass();
    const deps = await Promise.all(
      config.dependencies.map((dep) => this.resolveAsync(dep)),
    );
    return new config.useClass(...deps);
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
    if (this.debug && config.lifecycle === "immutable") {
      Logger.debug(
        `Stored immutable instance for ${Logger.formatToken(this.formatToken(token))}`,
      );
    }
  }

  private tryFastResolve<T>(token: Token): T | typeof FAST_MISS {
    const meta = this.registry.getMeta(token);
    if (!meta) return FAST_MISS;

    if (meta.isImmutable) {
      const cached = this.lifecycleCache.immutable.get(token);
      if (cached !== undefined) return cached as T;
      return FAST_MISS;
    }

    if (meta.isSingleton && !meta.hasTtl) {
      const wrapper = this.lifecycleCache.singletons.get(token);
      if (wrapper) return wrapper.instance as T;
      return FAST_MISS;
    }

    if (meta.isScoped && meta.useClass) {
      const wrapper = this.lifecycleCache.scoped.get(token);
      if (wrapper) return wrapper.instance as T;
      if (!meta.hasDeps) {
        const instance = new meta.useClass();
        this.lifecycleCache.scoped.set(token, { instance, lastUsed: 0 });
        return instance as T;
      }
      return FAST_MISS;
    }

    if (meta.isTransient && meta.useClass && !meta.hasDeps) {
      return new meta.useClass() as T;
    }

    return FAST_MISS;
  }

  private getInstanceFromRequestScope(token: Token) {
    return this.lifecycleCache.scoped.get(token);
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

    for (const dependency of config.dependencies) {
      if (!this.dependencyGraph.has(dependency)) {
        this.dependencyGraph.set(dependency, new Set());
      }
      this.dependencyGraph.get(dependency)!.add(token);
      if (this.debug) {
        Logger.debug(
          `Tracking dependency: ${Logger.formatToken(this.formatToken(token))} -> ${Logger.formatToken(this.formatToken(dependency))}`,
        );
      }
    }
  }

  private invalidateDependents(token: Token): void {
    const dependents = this.dependencyGraph.get(token);
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
    this.observables.set(token, { unsubscribe: config.observable.unsubscribe });
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
    return this.promiseCache.createKey(token, methodName, args);
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
        const name = value.displayName || value.name || "Component";
        const isComponent = Boolean(value.displayName) || /^[A-Z]/.test(name);
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
    if (this.graphPrinted && process.env.NODE_ENV === "development") return;
    if (!this.dependencyGraph.size) {
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
    for (const [dependency, dependents] of this.dependencyGraph) {
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
    for (const [dependency, dependents] of this.dependencyGraph) {
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
