import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { GarbageCollector } from "../garbage-collector";
import { DependencyResolver } from "../dependency-resolver";
import { Logger } from "../logger";
import { Token, InstanceWrapper } from "../../lib/@types";

// Mock do DependencyResolver
const createMockResolver = () => {
  const instances = new Map<Token, InstanceWrapper>();

  return {
    getInstances: vi.fn().mockReturnValue(instances.entries()),
    deleteInstance: vi.fn(),
    instances,
  };
};

describe("GarbageCollector", () => {
  let gc: GarbageCollector;
  let mockResolver: ReturnType<typeof createMockResolver>;

  beforeEach(() => {
    // Mock do Logger
    vi.spyOn(Logger, "info").mockImplementation(() => {});

    // Mock do setInterval e clearInterval
    vi.spyOn(global, "setInterval").mockImplementation((callback, interval) => {
      return 123 as unknown as NodeJS.Timeout; // ID fictício
    });
    vi.spyOn(global, "clearInterval").mockImplementation(() => {});

    // Criar mock do resolver
    mockResolver = createMockResolver();

    // Criar instância do GarbageCollector
    gc = new GarbageCollector(mockResolver as unknown as DependencyResolver);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("start method", () => {
    it("should start the garbage collector with specified ttl and interval", () => {
      // Arrange
      const ttl = 60000;
      const interval = 30000;

      // Act
      gc.start(ttl, interval);

      // Assert
      expect(global.setInterval).toHaveBeenCalledTimes(1);
      expect(global.setInterval).toHaveBeenCalledWith(
        expect.any(Function),
        interval,
      );
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining(`TTL=${ttl}ms, Interval=${interval}ms`),
      );
    });

    it("should clear existing timer when starting again", () => {
      // Arrange
      gc.start(60000, 30000); // Start first time

      // Act
      gc.start(60000, 30000); // Start second time

      // Assert
      expect(global.clearInterval).toHaveBeenCalledTimes(1);
      expect(global.setInterval).toHaveBeenCalledTimes(2);
    });

    it("should collect instances that exceed the ttl", () => {
      // Arrange
      const ttl = 60000;
      const interval = 30000;
      const now = Date.now();

      // Mock Date.now
      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(now);

      // Add instances to the mock resolver
      const token1 = "TOKEN_1";
      const token2 = "TOKEN_2";

      mockResolver.instances.set(token1, {
        instance: {},
        lastUsed: now - ttl - 1000, // Older than ttl
      });

      mockResolver.instances.set(token2, {
        instance: {},
        lastUsed: now - ttl + 1000, // Newer than ttl
      });

      mockResolver.getInstances.mockReturnValue(
        mockResolver.instances.entries(),
      );

      // Act
      gc.start(ttl, interval);

      // Manually trigger the interval callback
      const intervalCallback = (global.setInterval as unknown as Mock).mock
        .calls[0][0];
      intervalCallback();

      // Restore Date.now
      Date.now = originalDateNow;

      // Assert
      expect(mockResolver.deleteInstance).toHaveBeenCalledTimes(1);
      expect(mockResolver.deleteInstance).toHaveBeenCalledWith(token1);
      expect(mockResolver.deleteInstance).not.toHaveBeenCalledWith(token2);
      expect(Logger.info).toHaveBeenCalledWith(
        expect.stringContaining(
          `Garbage collecting instance for token: ${token1}`,
        ),
      );
    });
  });

  describe("stop method", () => {
    it("should stop the garbage collector if timer exists", () => {
      // Arrange
      gc.start(60000, 30000); // Start to create timer

      // Act
      gc.stop();

      // Assert
      expect(global.clearInterval).toHaveBeenCalledTimes(1);
      expect(Logger.info).toHaveBeenCalledWith("Garbage collector stopped.");
    });

    it("should do nothing if timer does not exist", () => {
      // Act
      gc.stop(); // Stop without starting

      // Assert
      expect(global.clearInterval).not.toHaveBeenCalled();
      expect(Logger.info).not.toHaveBeenCalledWith(
        "Garbage collector stopped.",
      );
    });
  });
});
