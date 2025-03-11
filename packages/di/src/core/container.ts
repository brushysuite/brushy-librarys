import { ProviderConfig, Token } from "../lib/@types";
import { DependencyRegistry } from "./dependency-registry";
import { DependencyResolver } from "./dependency-resolver";
import { LifecycleManager } from "./life-cycle-manager";
import { Logger } from "./logger";

// Interface for observability events
export interface ContainerEvent {
  type: "register" | "resolve" | "error" | "import" | "clear";
  token?: Token;
  timestamp: number;
  details?: any;
}

// Type for observers
export type ContainerObserver = (event: ContainerEvent) => void;

export class Container {
  private readonly registry: DependencyRegistry;
  private readonly resolver: DependencyResolver;
  private readonly lifecycleManager: LifecycleManager;
  private readonly observers: Set<ContainerObserver> = new Set();
  private readonly name: string;
  private readonly parent: Container | null = null;

  constructor({
    providers = [],
    debug = false,
    name = "default",
    parent = null,
  }: {
    providers?: Array<{
      provide: Token;
      useValue?: any;
      useClass?: new (...args: any[]) => any;
      useFactory?: () => any;
      lifecycle?: "singleton" | "transient" | "scoped";
      ttl?: number;
      dependencies?: Token[];
    }>;
    debug?: boolean;
    name?: string;
    parent?: Container | null;
  } = {}) {
    this.name = name;
    this.parent = parent;
    this.registry = new DependencyRegistry();
    this.resolver = new DependencyResolver(this.registry, debug);
    this.lifecycleManager = new LifecycleManager(this.resolver);

    providers.forEach((config) => {
      const providerConfig: ProviderConfig = {
        useClass: config.useClass,
        useFactory: config.useFactory,
        useValue: config.useValue,
        lifecycle: config.lifecycle,
        ttl: config.ttl,
        dependencies: config.dependencies,
      };
      this.register(config.provide, providerConfig);
    });

    this.emitEvent({
      type: "register",
      details: { containerName: name, providersCount: providers.length },
      timestamp: Date.now(),
    });
  }

  /**
   * Registers an observer for container events
   * @param observer Function to be called when events occur
   * @returns Function to remove the observer
   */
  observe(observer: ContainerObserver): () => void {
    this.observers.add(observer);
    return () => {
      this.observers.delete(observer);
    };
  }

  /**
   * Emits an event to all observers
   */
  private emitEvent(event: ContainerEvent): void {
    this.observers.forEach((observer) => {
      try {
        observer(event);
      } catch (error: unknown) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        Logger.error(`Error notifying observer: ${errorMessage}`);
      }
    });
  }

  /**
   * Formats an error for event emission
   * @param error The error to format
   * @returns The formatted error message
   */
  private formatErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }

  /**
   * Imports providers from another container
   * @param container Container to be imported
   * @param options Import options
   */
  import(
    container: Container,
    options: {
      overrideExisting?: boolean;
      prefix?: string;
    } = {},
  ): void {
    const providers = container.exportProviders();

    providers.forEach(({ token, config }) => {
      const targetToken = options.prefix
        ? `${options.prefix}.${String(token)}`
        : token;

      if (options.overrideExisting || !this.registry.has(targetToken)) {
        this.register(targetToken, config);
      }
    });

    this.emitEvent({
      type: "import",
      details: {
        sourceContainer: container.getName(),
        targetContainer: this.name,
        providersCount: providers.length,
        options,
      },
      timestamp: Date.now(),
    });
  }

  /**
   * Exports all providers registered in this container
   * @returns Array of tokens and configurations
   */
  exportProviders(): Array<{ token: Token; config: ProviderConfig }> {
    return this.registry.getAllProviders();
  }

  /**
   * Gets the name of this container
   */
  getName(): string {
    return this.name;
  }

  /**
   * Registers a provider in the container
   */
  register<T>(token: Token, config: ProviderConfig<T>) {
    const result = this.registry.register(token, config);

    this.emitEvent({
      type: "register",
      token,
      details: { config },
      timestamp: Date.now(),
    });

    return result;
  }

  /**
   * Resolves a dependency from the container
   */
  resolve<T>(token: Token): T {
    try {
      // Try to resolve from the current container
      if (this.registry.has(token)) {
        const result = this.resolver.resolve<T>(token);

        this.emitEvent({
          type: "resolve",
          token,
          details: { success: true, source: "self" },
          timestamp: Date.now(),
        });

        return result;
      }

      // If not found and has a parent, try to resolve from the parent
      if (this.parent) {
        try {
          const result = this.parent.resolve<T>(token);

          this.emitEvent({
            type: "resolve",
            token,
            details: { success: true, source: "parent" },
            timestamp: Date.now(),
          });

          return result;
        } catch (error) {
          // Ignore parent error and continue
        }
      }

      // If it reaches here, it was not found anywhere
      throw new Error(`Token not registered: ${String(token)}`);
    } catch (error: unknown) {
      this.emitEvent({
        type: "error",
        token,
        details: {
          error,
          message: this.formatErrorMessage(error),
        },
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Resolves a dependency asynchronously
   */
  async resolveAsync<T>(token: Token): Promise<T> {
    try {
      const result = await this.resolver.resolveAsync<T>(token);

      this.emitEvent({
        type: "resolve",
        token,
        details: { success: true, async: true },
        timestamp: Date.now(),
      });

      return result;
    } catch (error: unknown) {
      this.emitEvent({
        type: "error",
        token,
        details: {
          error,
          message: this.formatErrorMessage(error),
          async: true,
        },
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  /**
   * Clears the request scope
   */
  clearRequestScope() {
    this.resolver.clearRequestScope();

    this.emitEvent({
      type: "clear",
      details: { scope: "request" },
      timestamp: Date.now(),
    });
  }

  startGarbageCollector(ttl: number = 60000, interval: number = 30000) {
    this.lifecycleManager.startGarbageCollector(ttl, interval);
  }

  stopGarbageCollector() {
    this.lifecycleManager.stopGarbageCollector();
  }

  invalidateCache(token: Token) {
    this.resolver.invalidateCache(token);
  }

  /**
   * Gets a cached promise for a method call - designed for use with React's 'use' hook
   * This prevents the creation of new promises on each render
   *
   * Example: const data = use(container.useAsyncMethod(HTTP_CLIENT, 'fetchData', [param1, param2]));
   *
   * @param token The dependency token
   * @param methodName The name of the method to be called
   * @param args Arguments to be passed to the method
   */
  getPromise<T>(
    token: Token,
    methodName: string,
    args: any[] = [],
  ): Promise<T> {
    return this.resolver.getCachedPromise<T>(token, methodName, args);
  }
}
