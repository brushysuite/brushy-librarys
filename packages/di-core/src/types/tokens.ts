import type { ProviderConfig } from "./index";

/** Token com tipo embutido (compile-time only) */
export type InjectionToken<T> = symbol & { readonly __type?: T };

/** Infere o tipo resolvido a partir do token */
export type ResolveType<T> = T extends InjectionToken<infer U>
  ? U
  : T extends abstract new (...args: any[]) => infer R
    ? R
    : unknown;

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

/** Cria token tipado — runtime: Symbol(description) */
export function createToken<T>(description?: string): InjectionToken<T> {
  return Symbol(description) as InjectionToken<T>;
}
