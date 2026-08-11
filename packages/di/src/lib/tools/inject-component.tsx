import React from "react";
import { inject } from "./inject";
import { Token } from "../@types";
import { Container } from "../../core/container";

const componentCaches = new WeakMap<Container, Map<Token, React.ComponentType<any>>>();

export const resetComponentCaches = (): void => {
  componentCache.clear();
};

const getComponentCache = (container: Container) => {
  let cache = componentCaches.get(container);
  if (!cache) {
    cache = new Map();
    componentCaches.set(container, cache);
  }
  return cache;
};

export const componentCache = new Map<Token, React.ComponentType<any>>();

export const renderErrorUI = (message: string, details?: string) => (
  <div
    style={{
      padding: "1rem",
      borderRadius: "0.5rem",
      backgroundColor: "transparent",
      borderWidth: 1,
      borderStyle: "solid",
      borderColor: "#ff0000",
      color: "#ff0000",
    }}
  >
    <h3 style={{ margin: 0, marginBottom: "0.5rem", fontSize: 14, fontWeight: "600" }}>
      Component Loading Error
    </h3>
    <p style={{ margin: 0 }}>{message}</p>
    {details ? (
      <pre style={{ marginTop: "0.5rem", fontSize: 12, overflow: "auto" }}>{details}</pre>
    ) : null}
  </div>
);

export const handleComponentNotFound = (token: Token, isDevelopment: boolean) => {
  console.error(`Component not found for token: ${String(token)}`);
  if (isDevelopment) return renderErrorUI(`Component not found: ${String(token)}`);
  return null;
};

export const handleResolveError = (
  token: Token,
  error: unknown,
  isDevelopment: boolean,
) => {
  console.error(`Error resolving component for token: ${String(token)}`, error);
  if (!isDevelopment) return null;
  return renderErrorUI(
    `Error resolving component: ${String(token)}`,
    error instanceof Error ? error.message : String(error),
  );
};

export function useInjectComponent<P extends React.JSX.IntrinsicAttributes>(
  token: Token,
  fallback?: React.ComponentType<P>,
): React.ComponentType<P> {
  return React.useMemo(() => {
    const Component = (props: P) => {
      const container = inject.getGlobalContainer();
      const cache = getComponentCache(container);

      if (cache.has(token)) {
        const Cached = cache.get(token) as React.ComponentType<P>;
        return <Cached {...props} />;
      }

      if (componentCache.has(token)) {
        const Cached = componentCache.get(token) as React.ComponentType<P>;
        cache.set(token, Cached);
        return <Cached {...props} />;
      }

      try {
        const Resolved = inject.resolve<React.ComponentType<P>>(token);
        if (typeof Resolved === "function") {
          cache.set(token, Resolved);
          componentCache.set(token, Resolved);
          return <Resolved {...props} />;
        }

        if (fallback) {
          const Fallback = fallback;
          return <Fallback {...props} />;
        }
        return handleComponentNotFound(token, process.env.NODE_ENV !== "production");
      } catch (error) {
        if (fallback) {
          const Fallback = fallback;
          return <Fallback {...props} />;
        }
        return handleResolveError(token, error, process.env.NODE_ENV !== "production");
      }
    };

    Component.displayName = `Injected(${String(token)})`;
    return Component;
  }, [token, fallback]);
}

export function createComponentsProvider(components: {
  [key: string | symbol]: React.ComponentType<any>;
}): React.FC<{ children: React.ReactNode }> {
  const container = inject.getGlobalContainer();
  const cache = getComponentCache(container);

  for (const [key, component] of Object.entries(components)) {
    container.register(key, { useValue: component });
    cache.set(key, component);
    componentCache.set(key, component);
  }

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <>{children}</>
  );

  Provider.displayName = "BrushyDIComponentProvider";
  return Provider;
}

export function registerComponent<
  P extends { children?: React.ReactNode } & React.JSX.IntrinsicAttributes,
>(token: Token, component: React.ComponentType<P>): void {
  const container = inject.getGlobalContainer();
  container.register(token, { useValue: component });
  getComponentCache(container).set(token, component);
  componentCache.set(token, component);
}
