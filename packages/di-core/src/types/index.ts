export type Token = string | symbol | Function;

export type Lifecycle = "singleton" | "transient" | "scoped" | "immutable";

export interface ProviderConfig<T = any> {
  useClass?: new (...args: any[]) => T;
  useFactory?: (...args: any[]) => T;
  useValue?: any;
  lifecycle?: Lifecycle;
  ttl?: number;
  promiseTtl?: number;
  observable?: {
    subscribe: (callback: (value: T) => void) => () => void;
    unsubscribe: () => void;
  };
  lazy?: boolean;
  dependencies?: Token[];
}

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

export type {
  InjectionToken,
  ResolveType,
  InferProviderType,
} from "./tokens";
export { createToken } from "./tokens";
