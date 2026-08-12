import { ContainerEvent } from "./container";

type Listener = (event: ContainerEvent) => void;

/**
 * Minimal event bus - works in Node, browser and React Native without EventTarget.
 */
export class ContainerEventBus {
  private listeners = new Set<Listener>();

  get hasListeners(): boolean {
    return this.listeners.size > 0;
  }

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  emit(event: ContainerEvent): void {
    if (!this.listeners.size) return;

    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // Guard: observer errors must not break resolution
      }
    }
  }
}
