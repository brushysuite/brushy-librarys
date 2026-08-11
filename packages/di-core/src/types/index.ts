import type {
  ValueProviderConfig,
  FactoryProviderConfig,
  ClassProviderConfig,
  ProviderConfigBase,
  Token,
  Lifecycle,
} from "./tokens";

export type {
  Token,
  Lifecycle,
  InjectionToken,
  ResolveType,
  InferProviderType,
  InferDependencies,
  FactoryProviderConfig,
  ClassProviderConfig,
  ValueProviderConfig,
  ProviderConfigBase,
} from "./tokens";
export { createToken, deps } from "./tokens";

export type ProviderConfig<T = unknown> =
  | ValueProviderConfig<T>
  | FactoryProviderConfig<T, readonly Token[]>
  | ClassProviderConfig<T, readonly Token[]>
  | (ProviderConfigBase & {
      useClass?: new (...args: any[]) => T;
      useFactory?: (...args: any[]) => T;
      useValue?: T;
      dependencies?: Token[];
    });

export interface InstanceWrapper {
  instance: any;
  lastUsed: number;
  dependencies?: Set<Token>;
}

export interface PromiseCacheEntry {
  promise: Promise<any>;
  timestamp: number;
  expiresAt: number;
}

export interface InjectOptions {
  cachePromises?: boolean;
  scope?: object;
}

export type MonitorEventType =
  | "register"
  | "resolve"
  | "error"
  | "import"
  | "clear"
  | "all";

export interface MonitorOptions {
  eventTypes?: MonitorEventType[];
  logToConsole?: boolean;
  maxEvents?: number;
}
