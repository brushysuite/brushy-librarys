import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { ContainerMonitor, monitor } from "../monitor";
import { Container, ContainerEvent } from "../../../core/container";
import { Logger } from "../../../core/logger";
import { MonitorEventType, MonitorOptions } from "../../../lib/@types";

vi.mock("../../../core/logger", () => ({
  Logger: {
    info: vi.fn(),
    formatToken: vi.fn((token) => `[${token}]`),
    formatType: vi.fn((type) => type.toUpperCase()),
  },
}));

describe("ContainerMonitor", () => {
  let mockContainer: Container;
  let observeCallback: ((event: ContainerEvent) => void) | null = null;
  let unsubscribeMock: () => void;

  beforeEach(() => {
    vi.clearAllMocks();

    unsubscribeMock = vi.fn();
    mockContainer = {
      observe: vi.fn((callback) => {
        observeCallback = callback;
        return unsubscribeMock;
      }),
    } as unknown as Container;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe("constructor", () => {
    it("should initialize with default options and start monitoring", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      expect(containerMonitor).toBeDefined();
      expect(mockContainer.observe).toHaveBeenCalled();
    });

    it("should merge provided options with defaults", () => {
      const options: MonitorOptions = {
        eventTypes: [
          "register" as MonitorEventType,
          "resolve" as MonitorEventType,
        ],
        logToConsole: false,
      };

      const containerMonitor = new ContainerMonitor(mockContainer, options);

      const registerEvent: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      const resolveEvent: ContainerEvent = {
        type: "resolve",
        timestamp: Date.now(),
      };

      const errorEvent: ContainerEvent = {
        type: "error",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(registerEvent);
        observeCallback(resolveEvent);
        observeCallback(errorEvent);
      }

      expect(Logger.info).not.toHaveBeenCalled();
      expect(containerMonitor.getEvents()).toHaveLength(2);
      expect(containerMonitor.getEvents()).not.toContainEqual(errorEvent);
    });
  });

  describe("start", () => {
    it("should start monitoring if not already started", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      containerMonitor.stop();

      vi.clearAllMocks();

      containerMonitor.start();

      expect(mockContainer.observe).toHaveBeenCalled();
    });

    it("should not start monitoring if already started", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      vi.clearAllMocks();

      containerMonitor.start();

      expect(mockContainer.observe).not.toHaveBeenCalled();
    });
  });

  describe("handleEvent", () => {
    it("should process events of specified types", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        eventTypes: ["register" as MonitorEventType],
      });

      const registerEvent: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      const resolveEvent: ContainerEvent = {
        type: "resolve",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(registerEvent);
        observeCallback(resolveEvent);
      }

      expect(containerMonitor.getEvents()).toHaveLength(1);
      expect(containerMonitor.getEvents()[0]).toEqual(registerEvent);
    });

    it('should process all events when eventTypes includes "all"', () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        eventTypes: ["all" as MonitorEventType],
      });

      const events: ContainerEvent[] = [
        { type: "register", timestamp: Date.now() },
        { type: "resolve", timestamp: Date.now() },
        { type: "error", timestamp: Date.now() },
      ];
      if (observeCallback) {
        //@ts-ignore
        events.forEach((event) => observeCallback(event));
      } else {
        throw new Error("observeCallback is null");
      }

      expect(containerMonitor.getEvents()).toHaveLength(3);
    });

    it("should not process events if eventTypes is empty", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        eventTypes: [],
      });

      const event: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(event);
      }

      expect(containerMonitor.getEvents()).toHaveLength(0);
    });

    it("should not process events if eventTypes is undefined", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        eventTypes: undefined,
      });

      const event: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(event);
      }

      expect(containerMonitor.getEvents()).toHaveLength(0);
    });
  });

  describe("enforceMaxEvents", () => {
    it("should limit the number of events to maxEvents", () => {
      const maxEvents = 2;
      const containerMonitor = new ContainerMonitor(mockContainer, {
        maxEvents,
      });

      const events: ContainerEvent[] = [
        { type: "register", timestamp: 1 },
        { type: "resolve", timestamp: 2 },
        { type: "error", timestamp: 3 },
      ];

      if (observeCallback) {
        events.forEach((event) => {
          if (observeCallback) {
            observeCallback(event);
          }
        });
      } else {
        throw new Error("observeCallback é nulo ou indefinido");
      }

      const storedEvents = containerMonitor.getEvents();
      expect(storedEvents).toHaveLength(maxEvents);
      expect(storedEvents[0]).toEqual(events[1]);
      expect(storedEvents[1]).toEqual(events[2]);
    });

    it("should not remove events if maxEvents is undefined", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        maxEvents: undefined,
      });

      const events: ContainerEvent[] = [
        { type: "register", timestamp: 1 },
        { type: "resolve", timestamp: 2 },
        { type: "error", timestamp: 3 },
      ];

      if (observeCallback) {
        events.forEach((event) => {
          if (observeCallback) {
            observeCallback(event);
          }
        });
      }

      expect(containerMonitor.getEvents()).toHaveLength(3);
    });
  });

  describe("logEventIfEnabled", () => {
    it("should log events when logToConsole is true", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        logToConsole: true,
      });

      const event: ContainerEvent = {
        type: "register",
        token: "TestService",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(event);
      }

      expect(Logger.info).toHaveBeenCalled();
      expect(Logger.formatToken).toHaveBeenCalledWith("TestService");
      expect(Logger.formatType).toHaveBeenCalledWith("register");
    });

    it("should log events with details when available", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        logToConsole: true,
      });

      const event: ContainerEvent = {
        type: "error",
        token: "TestService",
        timestamp: Date.now(),
        details: "Service not found",
      };

      if (observeCallback) {
        observeCallback(event);
      }

      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining("Service not found"),
      );
    });

    it("should log events without token", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        logToConsole: true,
      });

      const event: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(event);
      }

      expect(Logger.info).toHaveBeenCalledWith(
        expect.not.stringContaining("Token:"),
      );
    });

    it("should not log events when logToConsole is false", () => {
      const containerMonitor = new ContainerMonitor(mockContainer, {
        logToConsole: false,
      });

      const event: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(event);
      }

      expect(Logger.info).not.toHaveBeenCalled();
    });
  });

  describe("stop", () => {
    it("should stop monitoring and unsubscribe", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      containerMonitor.stop();

      expect(unsubscribeMock).toHaveBeenCalled();

      if (observeCallback) {
        observeCallback({
          type: "register",
          timestamp: Date.now(),
        });
      }
    });

    it("should do nothing if already stopped", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);
      containerMonitor.stop();
      vi.clearAllMocks();

      containerMonitor.stop();

      expect(unsubscribeMock).not.toHaveBeenCalled();
    });
  });

  describe("clearHistory", () => {
    it("should clear the event history", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      if (observeCallback) {
        observeCallback({
          type: "register",
          timestamp: Date.now(),
        });
      }

      expect(containerMonitor.getEvents()).toHaveLength(1);

      containerMonitor.clearHistory();

      expect(containerMonitor.getEvents()).toHaveLength(0);
    });
  });

  describe("getEvents", () => {
    it("should return a copy of the events array", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      const event: ContainerEvent = {
        type: "register",
        timestamp: Date.now(),
      };

      if (observeCallback) {
        observeCallback(event);
      }

      const events = containerMonitor.getEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toEqual(event);

      events.push({
        type: "resolve",
        timestamp: Date.now(),
      });

      expect(containerMonitor.getEvents()).toHaveLength(1);
    });
  });

  describe("getStats", () => {
    it("should calculate correct statistics with no events", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      const stats = containerMonitor.getStats();

      expect(stats.totalEvents).toBe(0);
      expect(stats.byType).toEqual({});
      expect(stats.errorRate).toBe(0);
      expect(stats.resolveSuccessRate).toBe(1);
    });

    it("should calculate correct statistics with mixed events", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      const events: ContainerEvent[] = [
        { type: "register", timestamp: 1 },
        { type: "resolve", timestamp: 2 },
        { type: "resolve", timestamp: 3 },
        { type: "error", timestamp: 4 },
        { type: "import", timestamp: 5 },
      ];

      if (observeCallback) {
        events.forEach((event) => {
          if (observeCallback) {
            observeCallback(event);
          }
        });
      }

      const stats = containerMonitor.getStats();

      expect(stats.totalEvents).toBe(5);
      expect(stats.byType).toEqual({
        register: 1,
        resolve: 2,
        error: 1,
        import: 1,
      });
      expect(stats.errorRate).toBe(1 / 5);
      expect(stats.resolveSuccessRate).toBe(1 / 2);
    });

    it("should handle case with no resolve events", () => {
      const containerMonitor = new ContainerMonitor(mockContainer);

      const events: ContainerEvent[] = [
        { type: "register", timestamp: 1 },
        { type: "import", timestamp: 2 },
      ];
      if (observeCallback) {
        events.forEach((event) => {
          if (observeCallback) {
            observeCallback(event);
          }
        });
      }

      const stats = containerMonitor.getStats();

      expect(stats.resolveSuccessRate).toBe(1);
    });
  });
});

describe("monitor utility", () => {
  it("should have a create method", () => {
    expect(typeof monitor.create).toBe("function");
  });

  it("should create a ContainerMonitor instance", () => {
    const mockContainer = {
      observe: vi.fn(() => vi.fn()),
    } as unknown as Container;
    const options = { maxEvents: 50 };

    const result = monitor.create(mockContainer, options);

    expect(result).toBeInstanceOf(ContainerMonitor);
  });
});
