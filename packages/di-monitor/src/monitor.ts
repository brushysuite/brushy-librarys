import type { Container, ContainerEvent, MonitorOptions } from "@brushy/di-core";

const formatToken = (token: string): string => token;
const formatType = (type: string): string => type;

export class ContainerMonitor {
  private container: Container;
  private events: ContainerEvent[] = [];
  private options: MonitorOptions;
  private unsubscribe: (() => void) | null = null;

  constructor(container: Container, options: MonitorOptions = {}) {
    this.container = container;
    this.options = {
      eventTypes: ["all"],
      logToConsole: true,
      maxEvents: 100,
      ...options,
    };
    this.start();
  }

  start(): void {
    if (this.unsubscribe) return;
    this.unsubscribe = this.container.observe(this.handleEvent.bind(this));
  }

  stop(): void {
    if (!this.unsubscribe) return;
    this.unsubscribe();
    this.unsubscribe = null;
  }

  clearHistory(): void {
    this.events = [];
  }

  getEvents(): ContainerEvent[] {
    return [...this.events];
  }

  getStats(): {
    totalEvents: number;
    byType: Record<string, number>;
    errorRate: number;
    resolveSuccessRate: number;
  } {
    const stats = {
      totalEvents: this.events.length,
      byType: {} as Record<string, number>,
      errorRate: 0,
      resolveSuccessRate: 1,
    };

    for (const event of this.events) {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    }

    const errors = stats.byType.error || 0;
    stats.errorRate = errors / (stats.totalEvents || 1);

    const resolveEvents = this.events.filter((event) => event.type === "resolve");
    const successfulResolves = resolveEvents.filter((event) => {
      const details = event.details as { success?: boolean } | undefined;
      return details?.success !== false;
    }).length;

    stats.resolveSuccessRate = resolveEvents.length ? successfulResolves / resolveEvents.length : 1;

    return stats;
  }

  private handleEvent(event: ContainerEvent): void {
    if (
      !this.options.eventTypes?.includes("all") &&
      !this.options.eventTypes?.includes(event.type)
    ) {
      return;
    }

    this.events.push(event);
    if (this.options.maxEvents && this.events.length > this.options.maxEvents) {
      this.events.shift();
    }

    if (!this.options.logToConsole) return;

    const tokenStr = event.token ? formatToken(String(event.token)) : "";
    const eventType = formatType(event.type);
    const details = event.details ? ` - ${event.details}` : "";

    console.info(
      "[DI:" +
        eventType +
        "]" +
        (tokenStr ? ` Token: ${tokenStr}` : "") +
        JSON.stringify(details, null, 2),
    );
  }
}

export const monitor = {
  create: (container: Container, options?: MonitorOptions) =>
    new ContainerMonitor(container, options),
};
