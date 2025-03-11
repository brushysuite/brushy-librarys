import { Container, ContainerEvent } from "../../core/container";
import { MonitorOptions } from "../@types";
import { Logger } from "../../core/logger";

/**
 * Class for monitoring container events and collecting metrics.
 * Provides functionality to track, log, and analyze dependency injection events.
 */
export class ContainerMonitor {
  private container: Container;
  private events: ContainerEvent[] = [];
  private options: MonitorOptions;
  private unsubscribe: (() => void) | null = null;

  /**
   * Creates a new container monitor instance.
   *
   * @param container - The container to monitor
   * @param options - Monitor configuration options
   *
   * @example
   * ```ts
   * const monitor = new ContainerMonitor(container, {
   *   eventTypes: ['resolve', 'register'],
   *   maxEvents: 100,
   *   logToConsole: true
   * });
   * ```
   */
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

  /**
   * Starts monitoring container events.
   * If monitoring is already active, this method has no effect.
   */
  start(): void {
    if (this.unsubscribe) {
      return;
    }

    this.unsubscribe = this.container.observe(this.handleEvent.bind(this));
  }

  /**
   * Stops monitoring container events and unsubscribes from the container.
   * Subsequent events will not be tracked until monitoring is started again.
   */
  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  /**
   * Clears all recorded events from the monitor's history.
   */
  clearHistory(): void {
    this.events = [];
  }

  /**
   * Returns a copy of all recorded events.
   *
   * @returns Array of container events
   */
  getEvents(): ContainerEvent[] {
    return [...this.events];
  }

  /**
   * Calculates and returns statistics about the monitored events.
   *
   * @returns Object containing various metrics:
   * - totalEvents: Total number of events recorded
   * - byType: Distribution of events by type
   * - errorRate: Ratio of error events to total events
   * - resolveSuccessRate: Ratio of successful resolves to total resolves
   *
   * @example
   * ```ts
   * const stats = monitor.getStats();
   * console.log(`Error rate: ${stats.errorRate * 100}%`);
   * ```
   */
  getStats(): {
    totalEvents: number;
    byType: Record<string, number>;
    errorRate: number;
    resolveSuccessRate: number;
  } {
    const stats = this.calculateBaseStats();
    this.calculateEventTypeDistribution(stats);
    this.calculateErrorRates(stats);

    return stats;
  }

  /**
   * Processes a received event based on monitor configuration.
   * @internal
   */
  private handleEvent(event: ContainerEvent): void {
    if (!this.shouldProcessEvent(event)) {
      return;
    }

    this.addEvent(event);
    this.enforceMaxEvents();
    this.logEventIfEnabled(event);
  }

  /**
   * Checks if an event should be processed based on configured event types.
   * @internal
   */
  private shouldProcessEvent(event: ContainerEvent): boolean {
    return (
      this.options.eventTypes?.includes("all") ||
      this.options.eventTypes?.includes(event.type) ||
      false
    );
  }

  /**
   * Adds an event to the history.
   * @internal
   */
  private addEvent(event: ContainerEvent): void {
    this.events.push(event);
  }

  /**
   * Maintains the maximum limit of events in the history.
   * @internal
   */
  private enforceMaxEvents(): void {
    if (this.options.maxEvents && this.events.length > this.options.maxEvents) {
      this.events.shift();
    }
  }

  /**
   * Logs the event to the console if logging is enabled.
   * @internal
   */
  private logEventIfEnabled(event: ContainerEvent): void {
    if (!this.options.logToConsole) {
      return;
    }

    const tokenStr = event.token ? Logger.formatToken(String(event.token)) : "";
    const eventType = Logger.formatType(event.type);
    const details = event.details ? ` - ${event.details}` : "";

    Logger.info(
      "[DI:" +
        eventType +
        "]" +
        (tokenStr ? " Token: " + tokenStr : "") +
        details,
    );
  }

  /**
   * Calculates the basic statistics.
   * @internal
   */
  private calculateBaseStats() {
    return {
      totalEvents: this.events.length,
      byType: {} as Record<string, number>,
      errorRate: 0,
      resolveSuccessRate: 1,
    };
  }

  /**
   * Calculates the distribution of events by type.
   * @internal
   */
  private calculateEventTypeDistribution(stats: {
    byType: Record<string, number>;
  }): void {
    this.events.forEach((event) => {
      stats.byType[event.type] = (stats.byType[event.type] || 0) + 1;
    });
  }

  /**
   * Calculates the error and success rates.
   * @internal
   */
  private calculateErrorRates(stats: {
    totalEvents: number;
    byType: Record<string, number>;
    errorRate: number;
    resolveSuccessRate: number;
  }): void {
    const errors = stats.byType["error"] || 0;
    stats.errorRate = errors / (stats.totalEvents || 1);

    const resolves = stats.byType["resolve"] || 0;
    stats.resolveSuccessRate = resolves ? (resolves - errors) / resolves : 1;
  }
}

/**
 * Utility for creating and managing container monitors.
 *
 * @example
 * ```ts
 * const containerMonitor = monitor.create(container, {
 *   eventTypes: ['all'],
 *   maxEvents: 1000,
 *   logToConsole: true
 * });
 * ```
 */
export const monitor = {
  /**
   * Creates a new monitor for a container.
   *
   * @param container - The container to monitor
   * @param options - Monitor configuration options
   * @returns A new ContainerMonitor instance
   */
  create: (container: Container, options?: MonitorOptions) => {
    return new ContainerMonitor(container, options);
  },
};
