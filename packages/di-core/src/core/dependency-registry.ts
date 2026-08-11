import { ProviderConfig, Token } from "../types";
import type { LifecycleType } from "./strategies/lifecycle";

export interface ProviderMeta {
  config: ProviderConfig;
  lifecycle: LifecycleType;
  isUseValue: boolean;
  isTransient: boolean;
  isSingleton: boolean;
  isScoped: boolean;
  isImmutable: boolean;
  hasTtl: boolean;
  hasDeps: boolean;
  useClass?: new (...args: unknown[]) => unknown;
}

/**
 * Manages provider registration — single responsibility, no side effects.
 */
export class DependencyRegistry {
  private readonly providers = new Map<Token, ProviderConfig>();
  private readonly meta = new Map<Token, ProviderMeta>();

  register<T>(token: Token, config: ProviderConfig<T>): void {
    this.providers.set(token, config);
    this.meta.set(token, this.createMeta(config));
  }

  registerMany(entries: Array<{ token: Token; config: ProviderConfig }>): void {
    for (const { token, config } of entries) {
      this.providers.set(token, config);
      this.meta.set(token, this.createMeta(config));
    }
  }

  private createMeta(config: ProviderConfig): ProviderMeta {
    const lifecycle = (config.lifecycle ?? "singleton") as LifecycleType;
    return {
      config,
      lifecycle,
      isUseValue: config.useValue !== undefined,
      isTransient: lifecycle === "transient",
      isSingleton: lifecycle === "singleton",
      isScoped: lifecycle === "scoped",
      isImmutable: lifecycle === "immutable",
      hasTtl: !!config.ttl,
      hasDeps: !!(config.dependencies?.length),
      useClass: config.useClass as ProviderMeta["useClass"],
    };
  }

  getProvider(token: Token): ProviderConfig | undefined {
    return this.providers.get(token);
  }

  getMeta(token: Token): ProviderMeta | undefined {
    return this.meta.get(token);
  }

  has(token: Token): boolean {
    return this.providers.has(token);
  }

  getAllProviders(): Array<{ token: Token; config: ProviderConfig }> {
    const result: Array<{ token: Token; config: ProviderConfig }> = [];
    for (const [token, config] of this.providers) {
      result.push({ token, config });
    }
    return result;
  }

  getAllTokens(): Token[] {
    return [...this.providers.keys()];
  }
}
