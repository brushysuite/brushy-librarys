import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Logger } from "../logger";

describe("Logger", () => {
  beforeEach(() => {
    vi.spyOn(console, "info").mockImplementation(() => {});
    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});

    // Reset the lastMessages cache
    Logger["lastMessages"] = {};
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Logging methods", () => {
    it("should log info messages", () => {
      // Act
      Logger.info("Info message");

      // Assert
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.info).toHaveBeenCalledWith(
        expect.stringMatching(/\[INFO\].*Info message/),
      );
    });

    it("should log debug messages", () => {
      // Act
      Logger.debug("Debug message");

      // Assert
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledWith(
        expect.stringMatching(/\[DEBUG\].*Debug message/),
      );
    });

    it("should log warning messages", () => {
      // Act
      Logger.warn("Warning message");

      // Assert
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringMatching(/\[WARN\].*Warning message/),
      );
    });

    it("should log error messages", () => {
      // Act
      Logger.error("Error message");

      // Assert
      expect(console.error).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledWith(
        expect.stringMatching(/\[ERROR\].*Error message/),
      );
    });

    it("should not log duplicate warning messages", () => {
      // Arrange
      const message = "Duplicate warning";

      // Mock isDuplicate to return true for warn messages
      const originalIsDuplicate = Logger["isDuplicate"];
      Logger["isDuplicate"] = vi.fn().mockImplementation((level, msg) => {
        if (level === "warn" && msg === message) {
          return true;
        }
        return originalIsDuplicate.call(Logger, level, msg);
      });

      // Act
      Logger.warn(message);

      // Assert
      expect(console.warn).not.toHaveBeenCalled();

      // Restore original method
      Logger["isDuplicate"] = originalIsDuplicate;
    });
  });

  describe("Formatting methods", () => {
    it("should format tokens", () => {
      // Act
      const formatted = Logger.formatToken("TEST_TOKEN");

      // Assert
      expect(formatted).toContain("TEST_TOKEN");
      // We can't easily test the exact color codes, but we can check it's not just the plain string
      expect(formatted).not.toBe("TEST_TOKEN");
    });

    it("should format class names", () => {
      // Act
      const formatted = Logger.formatClass("TestClass");

      // Assert
      expect(formatted).toContain("TestClass");
      expect(formatted).not.toBe("TestClass");
    });

    it("should format lifecycle types", () => {
      // Act
      const formatted = Logger.formatLifecycle("singleton");

      // Assert
      expect(formatted).toContain("singleton");
      expect(formatted).not.toBe("singleton");
    });

    it("should format types", () => {
      // Act
      const formatted = Logger.formatType("Function");

      // Assert
      expect(formatted).toContain("Function");
      expect(formatted).not.toBe("Function");
    });
  });

  describe("Duplicate message handling", () => {
    it("should prevent duplicate messages within the minimum interval", () => {
      // Arrange
      const message = "Duplicate message";

      // Act
      Logger.info(message);
      Logger.info(message); // This should be ignored as a duplicate

      // Assert
      expect(console.info).toHaveBeenCalledTimes(1);
    });

    it("should allow the same message after the minimum interval", () => {
      // Arrange
      const message = "Interval message";
      const originalNow = Date.now;

      // Act
      Logger.info(message);

      // Mock Date.now to return a time after the minimum interval
      Date.now = vi
        .fn()
        .mockReturnValue(originalNow() + Logger["MIN_INTERVAL_MS"] + 1);

      Logger.info(message); // This should be logged as enough time has passed

      // Restore original Date.now
      Date.now = originalNow;

      // Assert
      expect(console.info).toHaveBeenCalledTimes(2);
    });

    it("should track different message types separately", () => {
      // Arrange
      const message = "Multi-type message";

      // Act
      Logger.info(message);
      Logger.debug(message);
      Logger.warn(message);
      Logger.error(message);

      // Assert
      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.log).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });
});
