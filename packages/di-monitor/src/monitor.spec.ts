import { Container } from "@brushy/di-core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ContainerMonitor, monitor } from "./index";

describe("ContainerMonitor", () => {
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
    const containerMonitor = monitor.create(container, { logToConsole: false });

    container.register("SERVICE_1", { useValue: {} });
    container.register("SERVICE_2", { useValue: {} });
    container.resolve("SERVICE_1");
    container.resolve("SERVICE_2");

    const stats = containerMonitor.getStats();

    expect(stats.totalEvents).toBeGreaterThan(0);
    expect(stats.byType.register).toBe(2);
    expect(stats.byType.resolve).toBe(2);
    expect(stats.errorRate).toBe(0);
    expect(stats.resolveSuccessRate).toBe(1);

    containerMonitor.stop();
  });

  it("should keep resolveSuccessRate at 1 when no resolve events were recorded", () => {
    const containerMonitor = monitor.create(container, {
      logToConsole: false,
      eventTypes: ["register"],
    });

    container.register("ONLY_REGISTER", { useValue: {} });

    expect(containerMonitor.getStats().resolveSuccessRate).toBe(1);

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

    try {
      container.resolve("NON_EXISTENT_TOKEN");
    } catch {}

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

    expect(limitedMonitor.getEvents().length).toBe(2);

    limitedMonitor.stop();
  });

  it("should clear event history", () => {
    const containerMonitor = monitor.create(container, { logToConsole: false });

    container.register("TOKEN", { useValue: {} });
    expect(containerMonitor.getEvents().length).toBeGreaterThan(0);

    containerMonitor.clearHistory();
    expect(containerMonitor.getEvents().length).toBe(0);

    containerMonitor.stop();
  });

  it("should ignore duplicate start and stop when not subscribed", () => {
    const containerMonitor = new ContainerMonitor(container, {
      logToConsole: false,
    });
    const observeSpy = vi.spyOn(container, "observe");

    containerMonitor.stop();
    containerMonitor.stop();

    containerMonitor.start();
    containerMonitor.start();
    expect(observeSpy).toHaveBeenCalledTimes(1);

    containerMonitor.stop();
  });

  it("should count failed resolves when success is false in event details", () => {
    let handler: ((event: import("@brushy/di-core").ContainerEvent) => void) | undefined;
    vi.spyOn(container, "observe").mockImplementation((callback) => {
      handler = callback;
      return () => {};
    });

    const containerMonitor = monitor.create(container, {
      logToConsole: false,
      eventTypes: ["all"],
    });

    handler!({
      type: "resolve",
      token: "T",
      details: { success: false },
    });

    expect(containerMonitor.getStats().resolveSuccessRate).toBe(0);

    containerMonitor.stop();
  });

  it("should skip console logging when logToConsole is false", () => {
    const infoSpy = vi.spyOn(console, "info");
    const containerMonitor = monitor.create(container, { logToConsole: false });

    container.register("SILENT", { useValue: {} });

    expect(infoSpy).not.toHaveBeenCalled();
    containerMonitor.stop();
  });

  it("should compute errorRate with zero events and log events without details", () => {
    let handler: ((event: import("@brushy/di-core").ContainerEvent) => void) | undefined;
    const infoSpy = vi.spyOn(console, "info");
    vi.spyOn(container, "observe").mockImplementation((callback) => {
      handler = callback;
      return () => {};
    });

    const containerMonitor = monitor.create(container, { logToConsole: true });

    expect(containerMonitor.getStats().errorRate).toBe(0);

    handler!({ type: "import", token: "MODULE" });

    expect(infoSpy).toHaveBeenCalledWith(expect.stringContaining("[DI:import] Token: MODULE"));

    containerMonitor.stop();
  });

  it("should log clear events without token details", () => {
    const infoSpy = vi.spyOn(console, "info");
    const containerMonitor = monitor.create(container, {
      logToConsole: true,
      eventTypes: ["clear"],
    });

    container.clearRequestScope();

    expect(containerMonitor.getEvents().some((event) => event.type === "clear")).toBe(true);
    expect(infoSpy).toHaveBeenCalled();

    containerMonitor.stop();
  });

  it("should export monitor factory from index", () => {
    expect(monitor.create(container, { logToConsole: false })).toBeInstanceOf(ContainerMonitor);
  });
});
