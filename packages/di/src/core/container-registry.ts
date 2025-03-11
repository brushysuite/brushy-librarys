import { Logger } from "./logger";
import { Container } from "./container";
import { DependencyError } from "./dependency-error";

/**
 * Optimized container registry
 */
export class ContainerRegistry {
  private scopedContainers = new Map<object, Container>();

  private weakScopedContainers = new WeakMap<object, Container>();

  private defaultContainer: Container | null = null;

  private lastScope: object | null = null;
  private lastContainer: Container | null = null;

  registerContainer(scope: object, container: Container): void {
    if (this.isTransientScope(scope)) {
      this.scopedContainers.set(scope, container);
    } else {
      this.weakScopedContainers.set(scope, container);
    }

    this.lastScope = scope;
    this.lastContainer = container;

    Logger.debug("Container registered for scope");
  }

  setDefaultContainer(container: Container): void {
    this.defaultContainer = container;
    Logger.debug("Default container set");
  }

  getContainer(scope?: object): Container {
    if (scope && this.lastScope === scope && this.lastContainer) {
      return this.lastContainer;
    }

    if (scope) {
      if (this.scopedContainers.has(scope)) {
        const container = this.scopedContainers.get(scope)!;
        this.lastScope = scope;
        this.lastContainer = container;
        return container;
      }

      if (this.weakScopedContainers.has(scope)) {
        const container = this.weakScopedContainers.get(scope)!;
        this.lastScope = scope;
        this.lastContainer = container;
        return container;
      }
    }

    if (this.defaultContainer) {
      return this.defaultContainer;
    }

    throw new DependencyError(
      "No container found. Use registerContainer() or setDefaultContainer()",
    );
  }

  hasDefaultContainer(): boolean {
    return this.defaultContainer !== null;
  }

  private isTransientScope(scope: object): boolean {
    return (
      scope.constructor.name.includes("Request") ||
      scope.constructor.name.includes("Temporary") ||
      Object.keys(scope).length === 0
    );
  }

  cleanupTransientScopes(): void {
    this.scopedContainers.clear();
    this.lastScope = null;
    this.lastContainer = null;
  }
}
