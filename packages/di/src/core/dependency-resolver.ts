import { createElement, isValidElement } from "react";
import {
  InstanceWrapper,
  PromiseCache,
  ProviderConfig,
  Token,
} from "../lib/@types";
import { DependencyError } from "./dependency-error";
import { DependencyRegistry } from "./dependency-registry";
import { Logger } from "./logger";

/**
 * Resolves dependencies for the DI container
 */
export class DependencyResolver {
  private graphPrinted = false;

  private readonly instances = new Map<Token, InstanceWrapper>();
  private readonly requestScopeInstances = new Map<Token, InstanceWrapper>();

  private readonly resolvingStack: Token[] = [];
  private readonly dependencyGraph = new Map<Token, Set<Token>>();

  private readonly observables = new Map<Token, { unsubscribe: () => void }>();

  private readonly asyncResolvingPromises = new Map<Token, Promise<any>>();

  private readonly promiseCache = new Map<string, PromiseCache>();

  private readonly debug: boolean;

  private readonly resolutionStack: Set<Token> = new Set();

  constructor(
    private readonly registry: DependencyRegistry,
    debug: boolean = false,
  ) {
    this.debug = debug;
    Logger.info(`Debug mode: ${debug && "enabled"}`);
  }

  /**
   * Resolve a dependency synchronously
   */
  resolve<T>(token: Token, context?: Map<Token, any>): T {
    if (this.resolutionStack.has(token)) {
      const stackTrace = Array.from(this.resolutionStack)
        .map(String)
        .join(" -> ");
      throw new DependencyError(
        `Circular dependency detected: ${stackTrace} -> ${String(token)}`,
      );
    }

    this.resolutionStack.add(token);

    try {
      const result = this.resolveInstance<T>(token, context);

      if (this.debug && !this.graphPrinted) {
        const impl = this.getTokenInfo(token);
        Logger.debug(
          `Resolved ${Logger.formatToken(this.formatToken(token))} (${Logger.formatClass(impl)}) synchronously`,
        );
        this.printDependencyGraph();
        this.graphPrinted = true;
      }

      return result;
    } finally {
      this.resolutionStack.delete(token);
    }
  }

  /**
   * Resolve a dependency asynchronously
   */
  async resolveAsync<T>(token: Token, context?: Map<Token, any>): Promise<T> {
    const result = await this.resolveInstanceAsync<T>(token, context);

    if (this.debug) {
      Logger.debug(
        `Resolved ${Logger.formatToken(this.formatToken(token))} asynchronously`,
      );
      this.printDependencyGraph();
    }

    return result;
  }

  /**
   * Get a cached promise for a method call on a dependency
   * This is useful for React's 'use' hook to avoid multiple promise creations
   */
  getCachedPromise<T>(
    token: Token,
    methodName: string,
    args: any[] = [],
  ): Promise<T> {
    const instance = this.resolve(token) as { [key: string]: any };

    if (!instance || typeof instance[methodName] !== "function") {
      throw new DependencyError(
        `Cannot call method '${methodName}' on token '${String(token)}'`,
      );
    }

    const cacheKey = this.createPromiseCacheKey(token, methodName, args);

    const cachedItem = this.promiseCache.get(cacheKey);
    if (cachedItem && !this.isPromiseCacheExpired(cachedItem)) {
      if (this.debug) {
        Logger.debug(
          `Using cached promise for ${Logger.formatToken(this.formatToken(token))}.${methodName}()`,
        );
      }
      return cachedItem.promise as Promise<T>;
    }

    if (this.debug) {
      Logger.debug(
        `Creating new promise for ${Logger.formatToken(this.formatToken(token))}.${methodName}()`,
      );
    }

    const promise = instance[methodName](...args);

    this.promiseCache.set(cacheKey, {
      promise,
      timestamp: Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    return promise as Promise<T>;
  }

  /**
   * Clear all cached promises
   */
  clearPromiseCache(): void {
    this.promiseCache.clear();
    if (this.debug) {
      Logger.debug("Promise cache cleared");
    }
  }

  /**
   * Clear cached promises for a specific token
   */
  clearTokenPromiseCache(token: Token): void {
    const tokenPrefix = String(token);
    for (const key of this.promiseCache.keys()) {
      if (key.startsWith(tokenPrefix)) {
        this.promiseCache.delete(key);
      }
    }
    if (this.debug) {
      Logger.debug(
        `Promise cache cleared for ${Logger.formatToken(this.formatToken(token))}`,
      );
    }
  }

  /**
   * Clear request-scoped instances
   */
  clearRequestScope() {
    this.requestScopeInstances.clear();
  }

  /**
   * Invalidate a cached instance and its dependents
   */
  invalidateCache(token: Token) {
    this.instances.delete(token);
    this.observables.delete(token);
    this.invalidateDependentCaches(token);
  }

  /**
   * Get all cached instances
   */
  getInstances(): IterableIterator<[Token, InstanceWrapper]> {
    return this.instances.entries();
  }

  /**
   * Delete a specific instance and unsubscribe from its observable
   */
  deleteInstance(token: Token) {
    this.instances.delete(token);

    const observable = this.observables.get(token);
    observable?.unsubscribe?.();
    this.observables.delete(token);
  }

  /**
   * Resolve a dependency instance synchronously
   */
  private resolveInstance<T>(token: Token, context?: Map<Token, any>): T {
    const config = this.getConfig(token);

    if (!config) {
      throw new DependencyError(`Token não registrado: ${String(token)}`);
    }

    if (config.useValue !== undefined) {
      return this.handleDirectValue<T>(token, config);
    }

    this.checkCircularDependency(token);

    const localContext = context || new Map<Token, any>();
    const tokenName = this.formatToken(token);

    if (this.debug) {
      Logger.debug(
        `Starting resolution of dependency: ${Logger.formatToken(tokenName)}`,
      );
    }

    if (localContext.has(token)) {
      if (this.debug)
        Logger.debug(
          `Returning from resolution context: ${Logger.formatToken(tokenName)}`,
        );
      return localContext.get(token);
    }

    const cachedInstance = this.getFromCache<T>(token, tokenName);
    if (cachedInstance !== undefined) {
      return cachedInstance;
    }

    return this.createAndStoreInstance<T>(token, config, tokenName);
  }

  /**
   * Trata valores diretos (useValue)
   */
  private handleDirectValue<T>(token: Token, config: ProviderConfig): T {
    if (this.debug) {
      const info = this.getTokenInfo(token);
      Logger.debug(
        `Using direct value for ${Logger.formatToken(this.formatToken(token))} (${info})`,
      );
    }
    return config.useValue as T;
  }

  /**
   * Obtém uma instância do cache (singleton ou request scope)
   */
  private getFromCache<T>(token: Token, tokenName: string): T | undefined {
    const cachedInstance = this.getInstanceFromCache(token);
    if (cachedInstance) {
      if (this.debug)
        Logger.debug(
          `Returning from singleton cache: ${Logger.formatToken(tokenName)}`,
        );
      return cachedInstance.instance;
    }

    const scopedInstance = this.getInstanceFromRequestScope(token);
    if (scopedInstance) {
      if (this.debug)
        Logger.debug(
          `Returning from request scope: ${Logger.formatToken(tokenName)}`,
        );
      return scopedInstance.instance;
    }

    return undefined;
  }

  /**
   * Cria e armazena uma nova instância
   */
  private createAndStoreInstance<T>(
    token: Token,
    config: ProviderConfig,
    tokenName: string,
  ): T {
    this.resolvingStack.push(token);

    if (this.debug) {
      this.logInstanceCreation(tokenName, config);
    }

    let instance: any;
    try {
      instance = this.createInstance(config);
      if (!instance) {
        throw new DependencyError(`Failed to instantiate '${String(token)}'.`);
      }
      if (this.debug) {
        Logger.debug(
          `Successfully created instance of ${Logger.formatToken(tokenName)} (${Logger.formatClass(String(instance.constructor.name))})`,
        );
      }
    } catch (error: any) {
      Logger.error(
        `Failed to resolve ${Logger.formatToken(tokenName)}: ${error.message}`,
      );
      throw new DependencyError(
        `Failed to resolve dependency '${String(token)}'. Error: ${error.message}`,
      );
    } finally {
      this.resolvingStack.pop();
    }

    this.storeInstance(token, instance, config);
    this.trackDependencies(token, config);
    this.handleObservable(token, config);

    return instance;
  }

  /**
   * Loga informações sobre a criação da instância
   */
  private logInstanceCreation(tokenName: string, config: ProviderConfig): void {
    Logger.debug(`Creating instance of ${Logger.formatToken(tokenName)}`);
    if (config.dependencies?.length) {
      Logger.debug(
        `Dependencies for ${Logger.formatToken(tokenName)}: ${config.dependencies.map((d) => this.formatToken(d)).join(", ")}`,
      );
    }
  }

  /**
   * Resolve a dependency instance asynchronously
   */
  private async resolveInstanceAsync<T>(
    token: Token,
    context?: Map<Token, any>,
  ): Promise<T> {
    const localContext = context || new Map<Token, any>();

    if (localContext.has(token)) {
      return localContext.get(token);
    }

    const cachedInstance = this.getInstanceFromCache(token);
    if (cachedInstance) {
      return cachedInstance.instance;
    }

    const scopedInstance = this.getInstanceFromRequestScope(token);
    if (scopedInstance) {
      return scopedInstance.instance;
    }

    const config = this.getConfig(token);
    if (!config) {
      throw new DependencyError(
        `Dependency '${String(token)}' not registered.`,
      );
    }

    this.checkCircularDependency(token);

    if (this.asyncResolvingPromises.has(token)) {
      return this.asyncResolvingPromises.get(token) as Promise<T>;
    }

    this.resolvingStack.push(token);
    let instance: any;

    try {
      const resolvingPromise = (async () => {
        instance = await this.createInstanceAsync(config);
        if (!instance) {
          throw new DependencyError(
            `Failed to instantiate '${String(token)}'.`,
          );
        }

        this.storeInstance(token, instance, config);
        this.trackDependencies(token, config);
        this.handleObservable(token, config);

        return instance;
      })();

      this.asyncResolvingPromises.set(token, resolvingPromise);

      instance = await resolvingPromise;
    } catch (error: any) {
      throw new DependencyError(
        `Failed to resolve dependency '${String(token)}'. Error: ${error.message}`,
      );
    } finally {
      this.resolvingStack.pop();
      this.asyncResolvingPromises.delete(token);
    }

    if (this.debug) {
      Logger.debug(
        `Dependency Graph before printing: ${JSON.stringify(Array.from(this.dependencyGraph.entries()))}`,
      );
      this.printDependencyGraph();
    }

    return instance;
  }

  /**
   * Create an instance of a dependency
   */
  private createInstance<T>(config: ProviderConfig): T {
    if (this.debug) {
      if (config.useClass) {
        Logger.debug(
          `Creating using class: ${Logger.formatClass(config.useClass.name)}`,
        );
      } else if (config.useFactory) {
        Logger.debug(`Creating using factory`);
      }
    }

    if (config.useValue) {
      return config.useValue;
    }

    if (config.useFactory) {
      try {
        const deps = this.resolveDependenciesForFactory(config);
        const result = config.useFactory(...deps);
        return result;
      } catch (error: any) {
        Logger.error(`Factory error: ${error.message}`);
        throw error;
      }
    }

    if (config.useClass) {
      try {
        if (!config.dependencies || config.dependencies.length === 0) {
          return new config.useClass();
        }

        const deps = config.dependencies.map((dep) => {
          const resolved = this.resolve(dep);
          if (this.debug) {
            Logger.debug(
              `Resolved dependency ${this.formatToken(dep)} (${resolved?.constructor?.name ?? "unknown"})`,
            );
          }
          return resolved;
        });

        return new config.useClass(...deps);
      } catch (error: any) {
        Logger.error(`Class instantiation error: ${error.message}`);
        throw error;
      }
    }

    throw new DependencyError(`Invalid provider config.`);
  }

  /**
   * Create an instance asynchronously
   */
  private async createInstanceAsync(config: ProviderConfig): Promise<any> {
    if (config.useFactory) {
      return await config.useFactory();
    }

    if (config.useClass) {
      if (config.dependencies && config.dependencies.length > 0) {
        const resolvedDeps = await Promise.all(
          config.dependencies.map((dep) => this.resolveAsync(dep)),
        );
        return new config.useClass(...resolvedDeps);
      }
      return new config.useClass();
    }

    throw new DependencyError(
      `Invalid provider config for '${String(config)}'.`,
    );
  }

  /**
   * Track a dependency relationship
   */
  private trackDependency(dependent: Token, dependency: Token) {
    if (!this.dependencyGraph.has(dependency)) {
      this.dependencyGraph.set(dependency, new Set());
    }
    this.dependencyGraph.get(dependency)!.add(dependent);
    Logger.debug(
      `Tracking dependency: ${Logger.formatToken(this.formatToken(dependent))} -> ${Logger.formatToken(this.formatToken(dependency))}`,
    );
  }

  /**
   * Track all dependencies for a token
   */
  private trackDependencies(token: Token, config: ProviderConfig): void {
    if (!config.dependencies) {
      if (this.debug) {
        Logger.debug(
          `No dependencies defined for ${Logger.formatToken(this.formatToken(token))}`,
        );
      }
      return;
    }

    Logger.debug(
      `Tracking dependencies for ${Logger.formatToken(this.formatToken(token))}...`,
    );
    config.dependencies.forEach((dependency) => {
      this.trackDependency(token, dependency);
    });
  }

  /**
   * Invalidate dependent caches recursively
   */
  private invalidateDependentCaches(token: Token): void {
    const dependents = this.dependencyGraph.get(token);
    if (dependents) {
      dependents.forEach((dependent) => this.invalidateCache(dependent));
    }
  }

  /**
   * Check for circular dependencies
   */
  private checkCircularDependency(token: Token): void {
    if (this.resolvingStack.includes(token)) {
      throw new DependencyError(
        `Circular dependency detected: ${this.resolvingStack.map((t) => String(t)).join(" -> ")} -> ${String(token)}`,
      );
    }
  }

  /**
   * Get an instance from the cache
   */
  private getInstanceFromCache(token: Token): InstanceWrapper | undefined {
    const wrapper = this.instances.get(token);
    if (!wrapper) return undefined;

    const config = this.getConfig(token)!;
    if (config.ttl && Date.now() - wrapper.lastUsed > config.ttl) {
      this.instances.delete(token);
      return undefined;
    }

    wrapper.lastUsed = Date.now();
    return wrapper;
  }

  /**
   * Get an instance from the request scope
   */
  private getInstanceFromRequestScope(
    token: Token,
  ): InstanceWrapper | undefined {
    const wrapper = this.requestScopeInstances.get(token);
    if (!wrapper) return undefined;

    wrapper.lastUsed = Date.now();
    return wrapper;
  }

  /**
   * Store an instance in the appropriate cache
   */
  private storeInstance(
    token: Token,
    instance: any,
    config: ProviderConfig,
  ): void {
    if (config.lifecycle === "transient") return;

    const wrapper: InstanceWrapper = { instance, lastUsed: Date.now() };

    if (config.lifecycle === "scoped") {
      this.requestScopeInstances.set(token, wrapper);
      return;
    }

    this.instances.set(token, wrapper);
  }

  /**
   * Handle observable configuration
   */
  private handleObservable(token: Token, config: ProviderConfig): void {
    if (!config.observable) return;

    this.observables.set(token, {
      unsubscribe: config.observable.unsubscribe,
    });
  }

  /**
   * Get provider configuration for a token
   */
  private getConfig(token: Token): ProviderConfig | undefined {
    return this.registry.getProvider(token);
  }

  /**
   * Format a token for display in logs
   */
  private formatToken(token: Token): string {
    if (typeof token === "symbol") {
      const symbolString = token.toString();

      return symbolString.slice(7, -1);
    }
    return String(token);
  }

  /**
   * Get information about a token's implementation
   */
  private getTokenInfo(token: Token): string {
    const config = this.getConfig(token);
    if (!config) return "not registered";

    if (config.useValue !== undefined) {
      const value = config.useValue;

      if (typeof value === "function") {
        const displayName = value.displayName || value.name || "Component";

        const Demo = value as any;
        const isReactComponent = isValidElement(createElement(Demo));

        return isReactComponent
          ? `${Logger.formatClass(displayName)} (${Logger.formatType("ReactComponent")})`
          : `${Logger.formatClass(displayName)} (${Logger.formatType("Function")})`;
      }

      const typeName = value?.constructor?.name || typeof value;
      return `${Logger.formatClass(typeName)} (${Logger.formatType("Value")})`;
    }

    if (config.useClass) {
      const instance = this.instances.get(token)?.instance;
      const className = instance
        ? instance.constructor.name
        : config.useClass.name;
      return `${Logger.formatClass(className)} (${Logger.formatLifecycle(config.lifecycle || "singleton")})`;
    }

    if (config.useFactory) {
      const instance = this.instances.get(token)?.instance;
      const className = instance ? instance.constructor.name : "Factory";
      return `${Logger.formatClass(className)} (${Logger.formatLifecycle(config.lifecycle || "singleton")})`;
    }

    return "unknown";
  }

  /**
   * Print the dependency graph
   */
  private printDependencyGraph() {
    if (this.graphPrinted && process.env.NODE_ENV === "development") {
      return;
    }

    if (this.dependencyGraph.size === 0) {
      Logger.warn("No dependencies tracked yet");
      return;
    }

    this.printRegisteredTokens();
    this.printDependencyRelationships();
    this.printCachedInstances();
  }

  /**
   * Print registered tokens
   */
  private printRegisteredTokens() {
    Logger.info("Registered Tokens:");

    const allTokens = new Set<Token>();
    for (const [dependency, dependents] of this.dependencyGraph.entries()) {
      allTokens.add(dependency);
      for (const dependent of dependents) {
        allTokens.add(dependent);
      }
    }

    this.registry.getAllTokens().forEach((token) => {
      allTokens.add(token);
    });

    for (const token of allTokens) {
      const tokenName = this.formatToken(token);
      const classInfo = this.getTokenInfo(token);

      Logger.debug(`• ${Logger.formatToken(tokenName)}: ${classInfo}`);
    }
  }

  /**
   * Print dependency relationships
   */
  private printDependencyRelationships() {
    Logger.info("Dependency Relationships:");
    for (const [dependency, dependents] of this.dependencyGraph.entries()) {
      const depName = this.formatToken(dependency);
      const implInfo = this.getTokenInfo(dependency);

      if (dependents.size === 0) {
        Logger.debug(`• ${depName} (${implInfo}) - No dependents`);
        continue;
      }

      const dependentsStr = Array.from(dependents)
        .map((d) => {
          const dName = this.formatToken(d);
          const dImpl = this.getTokenInfo(d);
          return `${dName} (${dImpl})`;
        })
        .join(", ");

      Logger.debug(`• ${depName} (${implInfo}) ← Used by: ${dependentsStr}`);
    }
  }

  /**
   * Print cached instances
   */
  private printCachedInstances() {
    Logger.info("Cached Instances:");
    const cachedCount = this.instances.size;

    if (cachedCount === 0) {
      Logger.debug("No cached instances.");
      return;
    }

    for (const [token, wrapper] of this.instances.entries()) {
      const tokenName = this.formatToken(token);
      const className = wrapper.instance.constructor.name;
      const lastUsed = new Date(wrapper.lastUsed).toLocaleTimeString();
      Logger.debug(
        `• ${Logger.formatToken(tokenName)} (${Logger.formatClass(className)}) - Last used: ${lastUsed}`,
      );
    }
  }

  /**
   * Create a unique key for promise caching
   */
  private createPromiseCacheKey(
    token: Token,
    methodName: string,
    args: any[],
  ): string {
    return `${String(token)}:${methodName}:${JSON.stringify(args)}`;
  }

  /**
   * Check if a cached promise item is expired
   */
  private isPromiseCacheExpired(cachedItem: PromiseCache): boolean {
    return Date.now() > cachedItem.expiresAt;
  }

  /**
   * Resolve dependencies for a factory function
   */
  private resolveDependenciesForFactory(config: ProviderConfig): any[] {
    if (!config.dependencies || config.dependencies.length === 0) {
      return [];
    }

    return config.dependencies.map((dep) => {
      const resolved = this.resolve(dep);
      if (this.debug) {
        Logger.debug(
          `Resolved factory dependency ${this.formatToken(dep)} (${resolved?.constructor?.name ?? "unknown"})`,
        );
      }
      return resolved;
    });
  }
}
