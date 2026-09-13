export type Token = string | symbol | Function;

export type Lifecycle = "singleton" | "transient" | "scoped" | "immutable";

declare const INJECTION_TOKEN_TYPE: unique symbol;
declare const UNTYPED_TOKEN_TYPE: unique symbol;

/** Token com tipo embutido (compile-time only) */
export type InjectionToken<T> = symbol & {
  readonly [INJECTION_TOKEN_TYPE]: T;
};

/** Token criado sem genérico - recebe o tipo do provider retornado por `register`. */
export type UntypedInjectionToken = symbol & {
  readonly [UNTYPED_TOKEN_TYPE]: true;
};

/** Infere o tipo resolvido a partir do token */
export type ResolveType<T> =
  T extends InjectionToken<infer U>
    ? U
    : T extends abstract new (
          ...args: any[]
        ) => infer R
      ? R
      : unknown;

/** Infere tipos de dependências a partir de um tuple de tokens */
export type InferDependencies<D extends readonly Token[]> = {
  [K in keyof D]: D[K] extends Token ? ResolveType<D[K]> : never;
};

/** Infere T a partir de ProviderConfig */
export type InferProviderType<C> = C extends {
  useClass: infer Ctor extends new (...args: any[]) => infer R;
}
  ? R
  : C extends { useFactory: (...args: any[]) => infer R }
    ? R
    : C extends { useValue: infer V }
      ? V
      : unknown;

/** Preserva tuple de tokens para inferência em factories */
export function deps<const D extends readonly Token[]>(tokens: D): D {
  return tokens;
}

/** Config base compartilhada */
export interface ProviderConfigBase {
  lifecycle?: Lifecycle;
  ttl?: number;
  promiseTtl?: number;
  observable?: {
    subscribe: (callback: (value: unknown) => void) => () => void;
    unsubscribe: () => void;
  };
}

export type ValueProviderConfig<T> = ProviderConfigBase & {
  useValue: T;
  useClass?: never;
  useFactory?: never;
  dependencies?: never;
};

export type FactoryProviderConfig<
  T,
  D extends readonly Token[] = readonly Token[],
> = ProviderConfigBase & {
  useFactory: (...args: InferDependencies<D>) => T;
  dependencies: D;
  useValue?: never;
  useClass?: never;
};

export type ClassProviderConfig<
  T,
  D extends readonly Token[] = readonly Token[],
> = ProviderConfigBase & {
  useClass: new (...args: InferDependencies<D>) => T;
  dependencies?: D;
  useValue?: never;
  useFactory?: never;
};

/** Cria token tipado - runtime: Symbol(description) */
export function createToken(description?: string): UntypedInjectionToken;
export function createToken<T>(description?: string): InjectionToken<T>;
export function createToken(description?: string): symbol {
  return Symbol(description);
}
