import { Container } from "./container";
import { DependencyError } from "./dependency-error";
import { ROOT_SCOPE } from "./constants";
import { getActiveScope } from "../tools/request-scope-store";

/**
 * Container registry with scope caching — React Native safe (Map/WeakMap only).
 */
export class ContainerRegistry {
  private readonly scopedContainers = new Map<object, Container>();
  private readonly weakScopedContainers = new WeakMap<object, Container>();
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
  }

  setDefaultContainer(container: Container): void {
    this.defaultContainer = container;
  }

  getContainer(scope?: object): Container {
    const resolvedScope = scope ?? getActiveScope();

    if (resolvedScope && this.lastScope === resolvedScope && this.lastContainer) {
      return this.lastContainer;
    }

    if (resolvedScope) {
      const fromMap = this.scopedContainers.get(resolvedScope);
      if (fromMap) {
        this.lastScope = resolvedScope;
        this.lastContainer = fromMap;
        return fromMap;
      }

      const fromWeak = this.weakScopedContainers.get(resolvedScope);
      if (fromWeak) {
        this.lastScope = resolvedScope;
        this.lastContainer = fromWeak;
        return fromWeak;
      }
    }

    if (this.defaultContainer) return this.defaultContainer;

    throw new DependencyError(
      "No container found. Use registerContainer() or setDefaultContainer()",
    );
  }

  hasDefaultContainer(): boolean {
    return this.defaultContainer !== null;
  }

  cleanupTransientScopes(): void {
    this.scopedContainers.clear();
    this.lastScope = null;
    this.lastContainer = null;
  }

  private isTransientScope(scope: object): boolean {
    if (scope === ROOT_SCOPE) return false;
    return (
      scope.constructor.name.includes("Request") ||
      scope.constructor.name.includes("Temporary") ||
      Object.keys(scope).length === 0
    );
  }
}

export { ROOT_SCOPE };
