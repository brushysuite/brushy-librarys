import type { ProviderConfig, Token } from "./index";

/** Token com tipo embutido (compile-time only) */
export type InjectionToken<T> = symbol & { readonly __type?: T };

/** Infere o tipo resolvido a partir do token */
export type ResolveType<T> = T extends InjectionToken<infer U>
  ? U
  : T extends abstract new (...args: any[]) => infer R
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

export type FactoryProviderConfig<
  T,
  D extends readonly Token[] = readonly Token[],
> = Omit<ProviderConfig<T>, "useClass" | "useValue" | "useFactory"> & {
  useFactory: (...args: InferDependencies<D>) => T;
  dependencies: D;
};

export type ClassProviderConfig<
  T,
  D extends readonly Token[] = readonly Token[],
> = Omit<ProviderConfig<T>, "useValue" | "useFactory" | "useClass"> & {
  useClass: new (...args: InferDependencies<D>) => T;
  dependencies?: D;
};

/** Cria token tipado — runtime: Symbol(description) */
export function createToken<T>(description?: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}
