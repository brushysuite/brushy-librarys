import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Logger } from "../logger";

describe("Logger", () => {
  beforeEach(() => {
    Logger.setEnabled(true);
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
    Logger.setEnabled(false);
  });

  describe("Logging methods", () => {
    it("should log info messages", () => {
      Logger.info("test info");
      expect(console.info).toHaveBeenCalled();
    });

    it("should log debug messages", () => {
      Logger.debug("test debug");
      expect(console.log).toHaveBeenCalled();
    });

    it("should log warning messages", () => {
      Logger.warn("test warn");
      expect(console.warn).toHaveBeenCalled();
    });

    it("should log error messages", () => {
      Logger.error("test error");
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("Duplicate message handling", () => {
    it("should prevent duplicate messages within the minimum interval", () => {
      Logger.info("duplicate");
      Logger.info("duplicate");
      expect(console.info).toHaveBeenCalledTimes(1);
    });

    it("should allow the same message after the minimum interval", () => {
      vi.spyOn(Date, "now").mockReturnValueOnce(1000).mockReturnValueOnce(1500);
      Logger.info("delayed");
      Logger.info("delayed");
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it("should track different message types separately", () => {
      Logger.info("same");
      Logger.warn("same");
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
    });
  });

  describe("Formatting helpers", () => {
    it("should format tokens, classes, lifecycles and types", () => {
      expect(Logger.formatToken("TOKEN")).toContain("TOKEN");
      expect(Logger.formatClass("MyClass")).toContain("MyClass");
      expect(Logger.formatLifecycle("singleton")).toContain("singleton");
      expect(Logger.formatType("Factory")).toContain("Factory");
    });
  });

  describe("silent logger", () => {
    it("should expose no-op logging methods", async () => {
      const { silentLogger } = await import("../logger");

      expect(() => {
        silentLogger.info("info");
        silentLogger.debug("debug");
        silentLogger.warn("warn");
        silentLogger.error("error");
      }).not.toThrow();
    });
  });
});
