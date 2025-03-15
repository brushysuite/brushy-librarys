import { describe, it, expect, vi, beforeEach, afterEach, Mock } from "vitest";
import { GarbageCollector } from "../garbage-collector";
import { DependencyResolver } from "../dependency-resolver";
import { Logger } from "../logger";
import { Token, InstanceWrapper } from "../../lib/@types";

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
    vi.spyOn(Logger, "info").mockImplementation(() => {});

    vi.spyOn(global, "setInterval").mockImplementation((callback, interval) => {
      return 123 as unknown as NodeJS.Timeout;
    });
    vi.spyOn(global, "clearInterval").mockImplementation(() => {});

    mockResolver = createMockResolver();

    gc = new GarbageCollector(mockResolver as unknown as DependencyResolver);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  describe("start method", () => {
    it("should start the garbage collector with specified ttl and interval", () => {
      const ttl = 60000;
      const interval = 30000;

      gc.start(ttl, interval);

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
      gc.start(60000, 30000);

      gc.start(60000, 30000);

      expect(global.clearInterval).toHaveBeenCalledTimes(1);
      expect(global.setInterval).toHaveBeenCalledTimes(2);
    });

    it("should collect instances that exceed the ttl", () => {
      const ttl = 60000;
      const interval = 30000;
      const now = Date.now();

      const originalDateNow = Date.now;
      Date.now = vi.fn().mockReturnValue(now);

      const token1 = "TOKEN_1";
      const token2 = "TOKEN_2";

      mockResolver.instances.set(token1, {
        instance: {},
        lastUsed: now - ttl - 1000,
      });

      mockResolver.instances.set(token2, {
        instance: {},
        lastUsed: now - ttl + 1000,
      });

      mockResolver.getInstances.mockReturnValue(
        mockResolver.instances.entries(),
      );

      gc.start(ttl, interval);

      const intervalCallback = (global.setInterval as unknown as Mock).mock
        .calls[0][0];
      intervalCallback();

      Date.now = originalDateNow;

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
      gc.start(60000, 30000);

      gc.stop();

      expect(global.clearInterval).toHaveBeenCalledTimes(1);
      expect(Logger.info).toHaveBeenCalledWith("Garbage collector stopped.");
    });

    it("should do nothing if timer does not exist", () => {
      gc.stop();

      expect(global.clearInterval).not.toHaveBeenCalled();
      expect(Logger.info).not.toHaveBeenCalledWith(
        "Garbage collector stopped.",
      );
    });
  });
});
