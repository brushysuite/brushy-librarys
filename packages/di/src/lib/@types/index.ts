import { Container } from "../../core/container";

export type Token = string | symbol | Function;

export interface ProviderConfig<T = any> {
  useClass?: new (...args: any[]) => T;
  useFactory?: (...args: any[]) => T;
  useValue?: any;
  lifecycle?: "singleton" | "transient" | "scoped";
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

export interface PromiseCache {
  promise: Promise<any>;
  timestamp: number;
  expiresAt: number;
}

export interface DIProviderProps {
  container: Container;
  children: React.ReactNode;
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
