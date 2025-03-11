import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container, monitor } from "../index";

describe("Monitor", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should monitor container events", () => {
    const containerMonitor = monitor.create(container, {
      logToConsole: true,
      eventTypes: ["register", "resolve", "error"],
    });

    const infoSpy = vi.spyOn(console, "info");

    const HTTP_CLIENT = Symbol("HTTP_CLIENT");
    container.register(HTTP_CLIENT, { useValue: {} });
    container.resolve(HTTP_CLIENT);

    const events = containerMonitor.getEvents();
    expect(events.length).toBeGreaterThan(0);

    expect(events.some((e) => e.type === "register")).toBe(true);
    expect(events.some((e) => e.type === "resolve")).toBe(true);

    expect(infoSpy).toHaveBeenCalled();

    containerMonitor.stop();
  });

  it("should provide monitoring statistics", () => {
    const containerMonitor = monitor.create(container, {
      logToConsole: false,
    });

    container.register("SERVICE_1", { useValue: {} });
    container.register("SERVICE_2", { useValue: {} });
    container.resolve("SERVICE_1");
    container.resolve("SERVICE_2");

    const stats = containerMonitor.getStats();

    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.byType.register).toBe(2);
    expect(stats.byType.resolve).toBe(2);
    expect(stats.errorRate).toBe(0);

    containerMonitor.stop();
  });

  it("should filter events by type", () => {
    const registerMonitor = monitor.create(container, {
      logToConsole: false,
      eventTypes: ["register"],
    });

    const TOKEN = Symbol("TOKEN");
    container.register(TOKEN, { useValue: {} });
    container.resolve(TOKEN);

    const events = registerMonitor.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("register");

    registerMonitor.stop();
  });

  it("should monitor error events", () => {
    const errorMonitor = monitor.create(container, {
      logToConsole: false,
      eventTypes: ["error"],
    });

    vi.spyOn(console, "error");

    try {
      container.resolve("NON_EXISTENT_TOKEN");
    } catch (error) {}

    const events = errorMonitor.getEvents();
    expect(events.length).toBe(1);
    expect(events[0].type).toBe("error");

    errorMonitor.stop();
  });

  it("should respect max events limit", () => {
    const limitedMonitor = monitor.create(container, {
      logToConsole: false,
      maxEvents: 2,
    });

    container.register("TOKEN_1", { useValue: {} });
    container.register("TOKEN_2", { useValue: {} });
    container.register("TOKEN_3", { useValue: {} });

    const events = limitedMonitor.getEvents();
    expect(events.length).toBe(2);

    limitedMonitor.stop();
  });

  it("should clear event history", () => {
    const containerMonitor = monitor.create(container, {
      logToConsole: false,
    });

    container.register("TOKEN", { useValue: {} });

    expect(containerMonitor.getEvents().length).toBeGreaterThan(0);

    containerMonitor.clearHistory();

    expect(containerMonitor.getEvents().length).toBe(0);

    containerMonitor.stop();
  });
});
