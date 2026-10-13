export type Listener<T = any> = (payload: T) => void;

export class EventEmitter {
  private listeners: Record<string, Listener[]> = {};

  on(event: string, listener: Listener) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(listener);
  }

  emit(event: string, payload: any) {
    const list = this.listeners[event];
    if (!list) return;
    for (const l of list) {
      l(payload);
    }
  }
}
