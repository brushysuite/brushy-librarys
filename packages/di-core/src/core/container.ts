import { ProviderConfig, Token, InstanceWrapper } from "../types";
import type {
  InjectionToken,
  FactoryProviderConfig,
  ClassProviderConfig,
  ValueProviderConfig,
  UntypedInjectionToken,
} from "../types/tokens";
import { isDev } from "./constants";
import { DependencyError } from "./dependency-error";
import { DependencyRegistry, type ProviderRecord } from "./dependency-registry";
import { DependencyResolver } from "./dependency-resolver";
import { LifecycleManager } from "./life-cycle-manager";
import { ContainerEventBus } from "./events";
import { Logger } from "./logger";

export interface ContainerEvent {
  type: "register" | "resolve" | "error" | "import" | "clear";
  token?: Token;
  timestamp: number;
  details?: unknown;
}

export type ContainerObserver = (event: ContainerEvent) => void;

export class ScopedContainer {
  constructor(
    private readonly container: Container,
    private readonly scopeKey: object,
    private readonly bucket: Map<Token, InstanceWrapper>,
  ) {}

  resolve<T>(token: InjectionToken<T>): T;
  resolve<C extends abstract new (...args: any[]) => any>(
    token: C,
  ): InstanceType<C>;
  resolve<T>(token: Token): T;
  resolve<T>(token: Token): T {
    return this.container.resolveInScope<T>(token, this.scopeKey, this.bucket);
  }

  dispose(): void {
    this.container.clearScopedInstances(this.scopeKey);
  }
}

export class Container {
  private readonly registry = new DependencyRegistry();
  private readonly resolver: DependencyResolver;
  private lifecycleManager: LifecycleManager | null = null;
  private events: ContainerEventBus | null = null;
  private hasListeners = false;
  private readonly name: string;
  private readonly parent: Container | null;
  /** Monomorphic last-hit cache for repeated resolve of the same token. */
  private lastToken: Token | null = null;
  private lastCached: unknown = null;
  private lastHasCached = false;

  constructor({
    providers,
    debug = false,
    name = "default",
    parent = null,
  }: {
    providers?: Array<{
      provide: Token;
      useValue?: unknown;
      useClass?: new (...args: unknown[]) => unknown;
      useFactory?: () => unknown;
      lifecycle?: ProviderConfig["lifecycle"];
      ttl?: number;
      dependencies?: Token[];
      promiseTtl?: number;
      observable?: ProviderConfig["observable"];
    }>;
    debug?: boolean;
    name?: string;
    parent?: Container | null;
  } = {}) {
    this.name = name;
    this.parent = parent;
    this.resolver = new DependencyResolver(this.registry, debug);

    if (providers !== undefined && providers.length > 0) {
      for (const config of providers) {
        this.register(config.provide, {
          useClass: config.useClass,
          useFactory: config.useFactory,
          useValue: config.useValue,
          lifecycle: config.lifecycle,
          ttl: config.ttl,
          dependencies: config.dependencies,
          promiseTtl: config.promiseTtl,
          observable: config.observable,
        });
      }
    }
  }

  observe(observer: ContainerObserver): () => void {
    const unsubscribe = this.getEventBus().subscribe(observer);
    this.hasListeners = true;
    return () => {
      unsubscribe();
      this.hasListeners = this.events?.hasListeners ?? false;
    };
  }

  private getLifecycleManager(): LifecycleManager {
    if (!this.lifecycleManager) {
      this.lifecycleManager = new LifecycleManager(this.resolver);
    }
    return this.lifecycleManager;
  }

  private getEventBus(): ContainerEventBus {
    if (!this.events) {
      this.events = new ContainerEventBus();
    }
    return this.events;
  }

  private emit(event: ContainerEvent): void {
    if (!this.hasListeners) return;
    this.getEventBus().emit(event);
  }

  private formatErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  import(
    container: Container,
    options: { overrideExisting?: boolean; prefix?: string } = {},
  ): void {
    for (const { token, config } of container.exportProviders()) {
      const targetToken = options.prefix
        ? `${options.prefix}.${String(token)}`
        : token;

      if (options.overrideExisting || !this.registry.has(targetToken)) {
        this.register(targetToken, config);
      }
    }

    if (this.hasListeners) {
      this.emit({
        type: "import",
        details: {
          sourceContainer: container.getName(),
          targetContainer: this.name,
          providersCount: container.exportProviders().length,
          options,
        },
        timestamp: Date.now(),
      });
    }
  }

  exportProviders(): Array<{ token: Token; config: ProviderConfig }> {
    return this.registry.getAllProviders();
  }

  getName(): string {
    return this.name;
  }

  register<TValue>(
    token: UntypedInjectionToken,
    config: ValueProviderConfig<TValue>,
  ): InjectionToken<TValue>;
  register<TValue>(
    token: string | symbol,
    config: ValueProviderConfig<TValue>,
  ): InjectionToken<TValue>;
  register<T>(token: InjectionToken<T>, config: ProviderConfig<T>): InjectionToken<T>;
  register<T, D extends readonly Token[]>(
    token: InjectionToken<T>,
    config: FactoryProviderConfig<T, D>,
  ): InjectionToken<T>;
  register<T, D extends readonly Token[]>(
    token: InjectionToken<T>,
    config: ClassProviderConfig<T, D>,
  ): InjectionToken<T>;
  register<C extends abstract new (...args: any[]) => any>(
    token: C,
    config: ProviderConfig<InstanceType<C>>,
  ): InjectionToken<InstanceType<C>>;
  register<T>(token: Token, config: ProviderConfig<T>): InjectionToken<T>;
  register<T>(token: Token, config: ProviderConfig<T>): InjectionToken<T> {
    this.registry.register(token, config);
    if (this.lastToken === token) {
      this.lastToken = null;
      this.lastHasCached = false;
      this.lastCached = null;
    }
    if (this.hasListeners) {
      this.getEventBus().emit({
        type: "register",
        token,
        details: { config },
        timestamp: Date.now(),
      });
    }
    return token as InjectionToken<T>;
  }

  registerMany(entries: Array<{ token: Token; config: ProviderConfig }>): void {
    this.registry.registerMany(entries);
    if (!this.hasListeners) return;

    const bus = this.getEventBus();
    const timestamp = Date.now();
    for (const { token, config } of entries) {
      bus.emit({
        type: "register",
        token,
        details: { config },
        timestamp,
      });
    }
  }

  resolve<T>(token: InjectionToken<T>): T;
  resolve<C extends abstract new (...args: any[]) => any>(
    token: C,
  ): InstanceType<C>;
  resolve<T>(token: Token): T;
  resolve<T>(token: Token): T {
    if (!this.hasListeners) {
      if (this.lastHasCached && this.lastToken === token) {
        return this.lastCached as T;
      }

      const record = this.registry.getRecord(token);
      if (record) {
        if (record.isCached) {
          this.lastToken = token;
          this.lastCached = record.cached;
          this.lastHasCached = true;
          return record.cached as T;
        }
        if (record.isUseValue) {
          const value = record.config.useValue;
          this.lastToken = token;
          this.lastCached = value;
          this.lastHasCached = true;
          return value as T;
        }
        this.lastHasCached = false;
        return this.resolver.resolveWithRecord<T>(token, record);
      }
      if (this.parent) {
        return this.parent.resolve<T>(token);
      }
      throw new DependencyError(`Token not registered: ${String(token)}`);
    }

    try {
      let result: T;
      let source: "self" | "parent";

      if (this.registry.has(token)) {
        result = this.resolver.resolve<T>(token);
        source = "self";
      } else if (this.parent) {
        result = this.parent.resolve<T>(token);
        source = "parent";
      } else {
        throw new DependencyError(`Token not registered: ${String(token)}`);
      }

      this.getEventBus().emit({
        type: "resolve",
        token,
        details: { success: true, source },
        timestamp: Date.now(),
      });

      return result;
    } catch (error: unknown) {
      this.getEventBus().emit({
        type: "error",
        token,
        details: {
          error,
          message: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  resolveAsync<T>(token: InjectionToken<T>): Promise<T>;
  resolveAsync<C extends abstract new (...args: any[]) => any>(
    token: C,
  ): Promise<InstanceType<C>>;
  resolveAsync<T>(token: Token): Promise<T>;
  async resolveAsync<T>(token: Token): Promise<T> {
    try {
      let result: T;
      let source: "self" | "parent";

      if (this.registry.has(token)) {
        result = await this.resolver.resolveAsync<T>(token);
        source = "self";
      } else if (this.parent) {
        result = await this.parent.resolveAsync<T>(token);
        source = "parent";
      } else {
        throw new DependencyError(`Token not registered: ${String(token)}`);
      }

      this.emit({
        type: "resolve",
        token,
        details: { success: true, async: true, source },
        timestamp: Date.now(),
      });
      return result;
    } catch (error: unknown) {
      this.emit({
        type: "error",
        token,
        details: {
          error,
          message: error instanceof Error ? error.message : String(error),
          async: true,
        },
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  clearRequestScope(): void {
    this.resolver.clearRequestScope();
    if (this.hasListeners) {
      this.getEventBus().emit({
        type: "clear",
        details: { scope: "request" },
        timestamp: Date.now(),
      });
    }
  }

  createScope(scopeKey?: object): ScopedContainer {
    const key = scopeKey ?? Object.create(null);
    const bucket = this.resolver.getOrCreateScopeBucket(key);
    return new ScopedContainer(this, key, bucket);
  }

  resolveInScope<T>(token: InjectionToken<T>, scopeKey: object): T;
  resolveInScope<C extends abstract new (...args: any[]) => any>(
    token: C,
    scopeKey: object,
  ): InstanceType<C>;
  resolveInScope<T>(token: Token, scopeKey: object): T;
  resolveInScope<T>(
    token: Token,
    scopeKey: object,
    bucket?: Map<Token, InstanceWrapper>,
  ): T;
  resolveInScope<T>(
    token: Token,
    scopeKey: object,
    bucket?: Map<Token, InstanceWrapper>,
  ): T {
    if (!this.hasListeners) {
      if (this.registry.has(token)) {
        return this.resolver.resolveInScope<T>(token, scopeKey, bucket);
      }
      if (this.parent) {
        return this.parent.resolveInScope<T>(token, scopeKey);
      }
      throw new DependencyError(`Token not registered: ${String(token)}`);
    }

    try {
      let result: T;
      let source: "self" | "parent";

      if (this.registry.has(token)) {
        result = this.resolver.resolveInScope<T>(token, scopeKey, bucket);
        source = "self";
      } else if (this.parent) {
        result = this.parent.resolveInScope<T>(token, scopeKey, bucket);
        source = "parent";
      } else {
        throw new DependencyError(`Token not registered: ${String(token)}`);
      }

      this.getEventBus().emit({
        type: "resolve",
        token,
        details: { success: true, source, scoped: true },
        timestamp: Date.now(),
      });

      return result;
    } catch (error: unknown) {
      this.getEventBus().emit({
        type: "error",
        token,
        details: {
          error,
          message: error instanceof Error ? error.message : String(error),
        },
        timestamp: Date.now(),
      });
      throw error;
    }
  }

  clearScopedInstances(scopeKey: object): void {
    this.resolver.clearScopedInstances(scopeKey);
    if (this.hasListeners) {
      this.getEventBus().emit({
        type: "clear",
        details: { scope: scopeKey },
        timestamp: Date.now(),
      });
    }
  }

  getOrCreateScopeBucket(scopeKey: object): Map<Token, InstanceWrapper> {
    return this.resolver.getOrCreateScopeBucket(scopeKey);
  }

  startGarbageCollector(ttl = 60000, interval = 30000): void {
    this.getLifecycleManager().startGarbageCollector(ttl, interval);
  }

  stopGarbageCollector(): void {
    this.lifecycleManager?.stopGarbageCollector();
  }

  invalidateCache(token: Token): void {
    this.resolver.invalidateCache(token);
    if (this.lastToken === token) {
      this.lastToken = null;
      this.lastHasCached = false;
      this.lastCached = null;
    }
  }

  getPromise<T>(
    token: Token,
    methodName: string,
    args: unknown[] = [],
  ): Promise<T> {
    return this.resolver.getCachedPromise<T>(token, methodName, args);
  }

  verifyImmutableIntegrity(): (token: Token) => boolean {
    const instances = new Map<Token, unknown>();

    return (token: Token): boolean => {
      const instance = this.resolve(token);

      if (!instances.has(token)) {
        instances.set(token, instance);
        return true;
      }

      const isIntact = instances.get(token) === instance;
      if (!isIntact && isDev()) {
        Logger.error(
          `Immutable integrity violated for ${Logger.formatToken(String(token))}`,
        );
      }
      return isIntact;
    };
  }
}
