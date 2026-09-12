import type { InstanceWrapper, ProviderConfig, Token } from "../types";
import { type CompiledCreator, compileCreator } from "./compiled-creator";
import type { LifecycleType } from "./strategies/lifecycle";

export interface ProviderRecord {
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
  creator?: CompiledCreator;
  /** Inline singleton cache - stable shape for V8 ICs on warm path. */
  singletonWrapper?: InstanceWrapper;
  /** Direct cached instance for O(1) warm resolve without wrapper hop. */
  cached?: unknown;
  isCached: boolean;
}

/** @deprecated Use ProviderRecord */
export type ProviderMeta = ProviderRecord;

/**
 * Manages provider registration - single responsibility, no side effects.
 */
export class DependencyRegistry {
  private readonly records = new Map<Token, ProviderRecord>();

  register<T>(token: Token, config: ProviderConfig<T>): void {
    this.records.set(token, this.createRecord(config));
  }

  registerMany(entries: Array<{ token: Token; config: ProviderConfig }>): void {
    for (const { token, config } of entries) {
      this.records.set(token, this.createRecord(config));
    }
  }

  private createRecord(config: ProviderConfig): ProviderRecord {
    const lifecycle = (config.lifecycle ?? "singleton") as LifecycleType;
    const useClass = config.useClass as ProviderRecord["useClass"];
    const isUseValue = config.useValue !== undefined;
    const deps = config.dependencies;

    return {
      config,
      lifecycle,
      isUseValue,
      isTransient: lifecycle === "transient",
      isSingleton: lifecycle === "singleton",
      isScoped: lifecycle === "scoped",
      isImmutable: lifecycle === "immutable",
      hasTtl: config.ttl !== undefined && config.ttl !== null,
      hasDeps: deps !== undefined && deps.length > 0,
      useClass,
      isCached: false,
    };
  }

  ensureCreator(record: ProviderRecord): CompiledCreator | undefined {
    if (record.creator !== undefined) return record.creator;
    if (record.isUseValue || record.hasTtl) return undefined;
    const creator = compileCreator(record.config);
    if (creator) record.creator = creator;
    return creator;
  }

  getRecord(token: Token): ProviderRecord | undefined {
    return this.records.get(token);
  }

  getProvider(token: Token): ProviderConfig | undefined {
    return this.records.get(token)?.config;
  }

  getMeta(token: Token): ProviderRecord | undefined {
    return this.records.get(token);
  }

  has(token: Token): boolean {
    return this.records.has(token);
  }

  getAllProviders(): Array<{ token: Token; config: ProviderConfig }> {
    const result: Array<{ token: Token; config: ProviderConfig }> = [];
    for (const [token, record] of this.records) {
      result.push({ token, config: record.config });
    }
    return result;
  }

  getAllTokens(): Token[] {
    return [...this.records.keys()];
  }
}
