"use client";

import React from "react";
import { inject } from "./inject";
import { Token } from "../@types";

/**
 * A cache to store resolved components for faster subsequent access.
 */
export const componentCache = new Map<Token, React.ComponentType<any>>();

/**
 * Renders an error UI for component loading issues.
 * 
 * @param message - The error message to display.
 * @param details - Optional detailed error information.
 * @returns A React element displaying the error UI.
 */
export const renderErrorUI = (message: string, details?: string) => (
  <div
    style={{
      padding: "1rem",
      borderRadius: "0.5rem",
      backgroundColor: "transparent",
      border: "1px solid #ff0000",
      color: "#ff0000",
    }}
  >
    <h3
      style={{
        margin: 0,
        marginBottom: "0.5rem",
        fontSize: "0.875rem",
        fontWeight: "600",
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
      }}
    >
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "1.25rem",
          height: "1.25rem",
        }}
      >
        ⚠️
      </span>
      Component Loading Error
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          padding: "0.25rem 0.5rem",
          borderRadius: "9999px",
          fontSize: "0.75rem",
          fontWeight: "500",
          backgroundColor: "#ff0000",
          color: "#ffffff",
        }}
      >
        Error
      </span>
    </h3>
    <p style={{ margin: 0 }}>{message}</p>
    {details && (
      <pre
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem",
          backgroundColor: "transparent",
          borderRadius: "0.25rem",
          fontSize: "0.75rem",
          overflow: "auto",
          color: "#ff0000",
        }}
      >
        {details}
      </pre>
    )}
  </div>
);

/**
 * Handles the case when a component is not found in the DI container.
 * 
 * @param token - The token of the component that was not found.
 * @param isDevelopment - A flag indicating if the environment is development.
 * @returns A React element or null based on the environment.
 */
export const handleComponentNotFound = (
  token: Token,
  isDevelopment: boolean,
) => {
  console.error(`Component not found for token: ${String(token)}`);
  if (isDevelopment) {
    return renderErrorUI(`Component not found: ${String(token)}`);
  }
  return null;
};

/**
 * Handles errors that occur during component resolution.
 * 
 * @param token - The token of the component that failed to resolve.
 * @param error - The error that occurred during resolution.
 * @param isDevelopment - A flag indicating if the environment is development.
 * @returns A React element or null based on the environment.
 */
export const handleResolveError = (
  token: Token,
  error: unknown,
  isDevelopment: boolean,
) => {
  console.error(`Error resolving component for token: ${String(token)}`, error);
  if (isDevelopment) {
    return renderErrorUI(
      `Error resolving component: ${String(token)}`,
      error instanceof Error ? error.message : String(error),
    );
  }
  return null;
};

/**
 * Injects a React component from the DI container.
 * Works in both client and server components with automatic detection.
 * 
 * @param token - The token of the component to be injected.
 * @param fallback - Optional component to be used if the token is not registered.
 * @returns A React component that renders the injected component.
 * 
 * @example
 * 
 * ```typescript
 * // Registering a component
 * const BUTTON_COMPONENT = Symbol('BUTTON_COMPONENT');
 * const MyButtonComponent: React.FC<{ variant: string }> = ({ variant, children }) => (
 *   <button className={`btn btn-${variant}`}>{children}</button>
 * );
 * container.register(BUTTON_COMPONENT, { useValue: MyButtonComponent });
 * 
 * // Using the injected component
 * const Button = useInjectComponent<React.FC<{ variant: string }>>(BUTTON_COMPONENT);
 * 
 * // Using with a fallback
 * const DefaultButton: React.FC<{ variant: string }> = ({ variant, children }) => (
 *   <button className={`default-btn default-btn-${variant}`}>{children}</button>
 * );
 * const ButtonWithFallback = useInjectComponent<React.FC<{ variant: string }>>(BUTTON_COMPONENT, DefaultButton);
 * 
 * // Rendering the component
 * <Button variant="primary">Click here</Button>
 * <ButtonWithFallback variant="secondary">Click here</ButtonWithFallback>
 * ```
 */
export function useInjectComponent<P extends React.JSX.IntrinsicAttributes>(
  token: Token,
  fallback?: React.ComponentType<P>,
): React.ComponentType<P> {
  return React.useMemo(() => {
    function Component(props: P) {
      if (componentCache.has(token)) {
        const CachedComponent = componentCache.get(
          token,
        ) as React.ComponentType<P>;
        return <CachedComponent {...props} />;
      }

      try {
        const ResolvedComponent = inject.resolve<React.ComponentType<P>>(token);

        if (ResolvedComponent && typeof ResolvedComponent === "function") {
          componentCache.set(token, ResolvedComponent);
          return <ResolvedComponent {...props} />;
        }

        if (fallback) {
          const Fallback = fallback;
          return <Fallback {...props} />;
        }

        return handleComponentNotFound(
          token,
          process.env.NODE_ENV !== "production",
        );
      } catch (error) {
        if (fallback) {
          const Fallback = fallback;
          return <Fallback {...props} />;
        }

        return handleResolveError(
          token,
          error,
          process.env.NODE_ENV !== "production",
        );
      }
    }

    Component.displayName = `Injected(${String(token)})`;
    return Component;
  }, [token, fallback]);
}

/**
 * Creates a server-compatible component provider.
 * This version works in both client and server components.
 * 
 * @param components - An object mapping tokens to React components.
 * @returns A React functional component that serves as a provider for the components.
 * 
 * @example
 * 
 * ```typescript
 * const BUTTON_COMPONENT = Symbol('BUTTON_COMPONENT');
 * const CARD_COMPONENT = Symbol('CARD_COMPONENT');
 * 
 * const Button: React.FC<{ variant: string }> = ({ variant, children }) => (
 *   <button className={`btn btn-${variant}`}>{children}</button>
 * );
 * 
 * const Card: React.FC<{ title: string }> = ({ title, children }) => (
 *   <div className="card">
 *     <h3>{title}</h3>
 *     <div>{children}</div>
 *   </div>
 * );
 * 
 * const UIComponentsProvider = createComponentsProvider({
 *   [BUTTON_COMPONENT]: Button,
 *   [CARD_COMPONENT]: Card,
 * });
 * 
 * // Usage
 * <UIComponentsProvider>
 *   <App />
 * </UIComponentsProvider>
 * ```
 */
export function createComponentsProvider(components: {
  [key: string | symbol]: React.ComponentType<any>;
}): React.FC<{ children: React.ReactNode }> {
  const container = inject.getGlobalContainer();
  Object.entries(components).forEach(([key, component]) => {
    container.register(key, { useValue: component });
    componentCache.set(key, component);
  });

  const Provider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    return <>{children}</>;
  };

  Provider.displayName = "BrushyDIComponentProvider";
  return Provider;
}

/**
 * Registers a React component in the DI container.
 * Works in both client and server components.
 * 
 * @param token - The token to register the component under.
 * @param component - The React component to register.
 * 
 * @example
 * 
 * ```typescript
 * const BUTTON_COMPONENT = Symbol('BUTTON_COMPONENT');
 * const MyButton: React.FC<{ variant: string }> = ({ variant, children }) => (
 *   <button className={`btn btn-${variant}`}>{children}</button>
 * );
 * 
 * registerComponent(BUTTON_COMPONENT, MyButton);
 * ```
 */
export function registerComponent<
  P extends { children?: React.ReactNode } & React.JSX.IntrinsicAttributes,
>(token: Token, component: React.ComponentType<P>): void {
  const container = inject.getGlobalContainer();
  container.register(token, { useValue: component });
  componentCache.set(token, component);
}
