"use client";

import React, { useEffect } from "react";
import { containerRegistry } from "..";
import { Container } from "../../core/container";

/**
 * React component that provides a dependency injection container to its children.
 * @param props The component props, including the container and optional scope.
 * @returns The children wrapped with the provided container.
 */
export const BrushyDIProvider: React.FC<{
  container: Container;
  children: React.ReactNode;
  scope?: object;
}> = ({ container, children, scope }) => {
  const actualScope = scope ?? {};

  containerRegistry.registerContainer(actualScope, container);

  if (!containerRegistry.hasDefaultContainer()) {
    containerRegistry.setDefaultContainer(container);
  }

  useEffect(() => {
    containerRegistry.registerContainer(actualScope, container);

    if (!containerRegistry.hasDefaultContainer()) {
      containerRegistry.setDefaultContainer(container);
    }

    return () => {
      if (containerRegistry.getContainer() === container) {
        return;
      }
    };
  }, [container, actualScope]);

  return <>{children}</>;
};
