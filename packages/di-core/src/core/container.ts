import { ProviderConfig, Token } from "../types";
import type { InjectionToken } from "../types/tokens";
import { IS_DEV } from "./constants";
import { DependencyRegistry } from "./dependency-registry";
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

export class Container {
  private readonly registry = new DependencyRegistry();
  private readonly resolver: DependencyResolver;
  private readonly lifecycleManager: LifecycleManager;
  private readonly events = new ContainerEventBus();
  private readonly name: string;
  private readonly parent: Container | null;

  constructor({
    providers = [],
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
      lazy?: boolean;
    }>;
    debug?: boolean;
    name?: string;
    parent?: Container | null;
  } = {}) {
    this.name = name;
    this.parent = parent;
    this.resolver = new DependencyResolver(this.registry, debug);
    this.lifecycleManager = new LifecycleManager(this.resolver);

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
        lazy: config.lazy,
      });
    }

    this.emit({
      type: "register",
      details: { containerName: name, providersCount: providers.length },
      timestamp: Date.now(),
    });
  }

  observe(observer: ContainerObserver): () => void {
    return this.events.subscribe(observer);
  }

  private emit(event: ContainerEvent): void {
    this.events.emit(event);
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

  exportProviders(): Array<{ token: Token; config: ProviderConfig }> {
    return this.registry.getAllProviders();
  }

  getName(): string {
    return this.name;
  }

  register<T>(token: InjectionToken<T>, config: ProviderConfig<T>): void;
  register<C extends abstract new (...args: any[]) => any>(
    token: C,
    config: ProviderConfig<InstanceType<C>>,
  ): void;
  register<T>(token: Token, config: ProviderConfig<T>): void;
  register<T>(token: Token, config: ProviderConfig<T>) {
    this.registry.register(token, config);
    this.emit({
      type: "register",
      token,
      details: { config },
      timestamp: Date.now(),
    });
  }

  resolve<T>(token: InjectionToken<T>): T;
  resolve<C extends abstract new (...args: any[]) => any>(
    token: C,
  ): InstanceType<C>;
  resolve<T>(token: Token): T;
  resolve<T>(token: Token): T {
    try {
      if (this.registry.has(token)) {
        const result = this.resolver.resolve<T>(token);
        this.emit({
          type: "resolve",
          token,
          details: { success: true, source: "self" },
          timestamp: Date.now(),
        });
        return result;
      }

      if (this.parent) {
        try {
          const result = this.parent.resolve<T>(token);
          this.emit({
            type: "resolve",
            token,
            details: { success: true, source: "parent" },
            timestamp: Date.now(),
          });
          return result;
        } catch {
          // fall through
        }
      }

      throw new Error(`Token not registered: ${String(token)}`);
    } catch (error: unknown) {
      this.emit({
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
      const result = await this.resolver.resolveAsync<T>(token);
      this.emit({
        type: "resolve",
        token,
        details: { success: true, async: true },
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
    this.emit({
      type: "clear",
      details: { scope: "request" },
      timestamp: Date.now(),
    });
  }

  startGarbageCollector(ttl = 60000, interval = 30000): void {
    this.lifecycleManager.startGarbageCollector(ttl, interval);
  }

  stopGarbageCollector(): void {
    this.lifecycleManager.stopGarbageCollector();
  }

  invalidateCache(token: Token): void {
    this.resolver.invalidateCache(token);
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
      if (!isIntact && process.env.NODE_ENV !== "production") {
        Logger.error(
          `Immutable integrity violated for ${Logger.formatToken(String(token))}`,
        );
      }
      return isIntact;
    };
  }
}
