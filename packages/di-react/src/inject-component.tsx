import type { InjectionToken, Token, UntypedInjectionToken } from "@brushy/di-core";
import { type Container, inject, isDev } from "@brushy/di-core";
import type React from "react";
import { useRef } from "react";
import { useDIContainer } from "./context";

const componentCaches = new WeakMap<Container, Map<Token, React.ComponentType<any>>>();

const getComponentCache = (container: Container) => {
  let cache = componentCaches.get(container);
  if (!cache) {
    cache = new Map();
    componentCaches.set(container, cache);
  }
  return cache;
};

export type InjectComponentErrorRenderer = (message: string, details?: string) => React.ReactNode;

let injectComponentErrorRenderer: InjectComponentErrorRenderer | null = null;

/** Override default dev error UI (web uses DOM; set View/Text on React Native). */
export function setInjectComponentErrorRenderer(
  renderer: InjectComponentErrorRenderer | null,
): void {
  injectComponentErrorRenderer = renderer;
}

function isDomEnvironment(): boolean {
  return typeof document !== "undefined" && typeof document.createElement === "function";
}

export const renderErrorUI = (message: string, details?: string) => {
  if (injectComponentErrorRenderer) {
    return injectComponentErrorRenderer(message, details);
  }

  if (!isDomEnvironment()) {
    return null;
  }

  return (
    <div
      style={{
        padding: "1rem",
        borderRadius: "0.5rem",
        borderWidth: 1,
        borderStyle: "solid",
        borderColor: "#ff0000",
        color: "#ff0000",
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: "0.5rem",
          fontSize: 14,
          fontWeight: "600",
        }}
      >
        Component Loading Error
      </h3>
      <p style={{ margin: 0 }}>{message}</p>
      {details ? (
        <pre style={{ marginTop: "0.5rem", fontSize: 12, overflow: "auto" }}>{details}</pre>
      ) : null}
    </div>
  );
};

export const handleComponentNotFound = (token: Token, isDevelopment: boolean) => {
  console.error(`Component not found for token: ${String(token)}`);
  if (isDevelopment) return renderErrorUI(`Component not found: ${String(token)}`);
  return null;
};

export const handleResolveError = (token: Token, error: unknown, isDevelopment: boolean) => {
  console.error(`Error resolving component for token: ${String(token)}`, error);
  if (!isDevelopment) return null;
  return renderErrorUI(
    `Error resolving component: ${String(token)}`,
    error instanceof Error ? error.message : String(error),
  );
};

interface ComponentRef {
  token: Token;
  component: React.ComponentType<any>;
}

const createNotFoundComponent = (token: Token, isDevelopment: boolean): React.FC<any> => {
  const NotFound: React.FC<any> = () => handleComponentNotFound(token, isDevelopment);
  NotFound.displayName = `NotFound(${String(token)})`;
  return NotFound;
};

const createResolveErrorComponent = (
  token: Token,
  error: unknown,
  isDevelopment: boolean,
): React.FC<any> => {
  const ResolveError: React.FC<any> = () => handleResolveError(token, error, isDevelopment);
  ResolveError.displayName = `ResolveError(${String(token)})`;
  return ResolveError;
};

export function useInjectComponent<T extends React.ComponentType<any>>(
  token: InjectionToken<T>,
  fallback?: T,
): T;
export function useInjectComponent<P extends React.JSX.IntrinsicAttributes>(
  token: UntypedInjectionToken,
  fallback: React.ComponentType<P>,
): React.ComponentType<P>;
export function useInjectComponent(token: UntypedInjectionToken): React.ComponentType<any>;
export function useInjectComponent<P extends React.JSX.IntrinsicAttributes>(
  token: Token,
  fallback: React.ComponentType<P>,
): React.ComponentType<P>;
export function useInjectComponent(
  token: Token,
  fallback?: React.ComponentType<any>,
): React.ComponentType<any>;
export function useInjectComponent(
  token: Token,
  fallback?: React.ComponentType<any>,
): React.ComponentType<any> {
  const container = useDIContainer();
  const isDevelopment = isDev();
  const ref = useRef<ComponentRef | null>(null);

  const stale = ref.current === null || ref.current.token !== token;

  if (stale) {
    const cache = getComponentCache(container);
    let component = cache.get(token);

    if (!component) {
      try {
        const resolved = container.resolve<React.ComponentType<any>>(token);
        if (typeof resolved === "function") {
          component = resolved;
          cache.set(token, resolved);
        } else if (fallback) {
          component = fallback;
        } else {
          component = createNotFoundComponent(token, isDevelopment);
        }
      } catch (error) {
        if (fallback) {
          component = fallback;
        } else {
          component = createResolveErrorComponent(token, error, isDevelopment);
        }
      }
    }

    ref.current = { token, component: component! };
  }

  return ref.current!.component;
}

/**
 * Synchronous helper to register a map of components into a container.
 * Call this outside React render (bootstrap, test setup, middleware)
 * before the components are consumed by `useInjectComponent`.
 */
export function registerComponents(
  container: Container,
  components: {
    [key: string | symbol]: React.ComponentType<any>;
  },
): void {
  const cache = getComponentCache(container);
  const keys = [...Object.keys(components), ...Object.getOwnPropertySymbols(components)] as Array<
    string | symbol
  >;

  for (const key of keys) {
    const component = components[key];
    if (!component) continue;
    container.register(key, { useValue: component });
    cache.set(key, component);
  }
}

export function createComponentsProvider(components: {
  [key: string | symbol]: React.ComponentType<any>;
}): React.FC<{ children: React.ReactNode }> {
  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const container = useDIContainer();
    const registeredRef = useRef(false);

    if (!registeredRef.current) {
      registeredRef.current = true;
      registerComponents(container, components);
    }

    return <>{children}</>;
  };

  Provider.displayName = "BrushyDIComponentProvider";
  return Provider;
}

export function registerComponent<
  P extends { children?: React.ReactNode } & React.JSX.IntrinsicAttributes,
>(token: Token, component: React.ComponentType<P>, container?: Container): void {
  const target = container ?? inject.getGlobalContainer();
  target.register(token, { useValue: component });
  getComponentCache(target).set(token, component);
}
