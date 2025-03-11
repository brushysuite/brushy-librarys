import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { inject } from "../inject";
import { containerRegistry } from "../..";
import { Container } from "../../../core/container";

vi.mock("../..", () => ({
  containerRegistry: {
    setDefaultContainer: vi.fn(),
    hasDefaultContainer: vi.fn(),
    getContainer: vi.fn(),
  },
}));

const mockContainer = {
  resolve: vi.fn(),
  resolveAsync: vi.fn(),
  clearRequestScope: vi.fn(),
} as unknown as Container;

const originalProcess = global.process;
const mockProcess = {
  on: vi.fn(),
  release: { name: "node" },
};

describe("inject", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    global.process = originalProcess;
  });

  describe("setGlobalContainer", () => {
    it("should set the container as the global container", () => {
      inject.setGlobalContainer(mockContainer);

      expect(containerRegistry.setDefaultContainer).toHaveBeenCalledWith(
        mockContainer,
      );
    });

    it("should set up auto clean for request scope in Node.js environment", () => {
      global.process = mockProcess as any;

      inject.setGlobalContainer(mockContainer, { autoCleanRequestScope: true });

      expect(containerRegistry.setDefaultContainer).toHaveBeenCalledWith(
        mockContainer,
      );
      expect(mockProcess.on).toHaveBeenCalledWith(
        "beforeExit",
        expect.any(Function),
      );

      const callback = mockProcess.on.mock.calls[0][1];
      callback();
      expect(mockContainer.clearRequestScope).toHaveBeenCalled();
    });

    it("should not set up auto clean if not in Node.js environment", () => {
      global.process = { ...mockProcess, release: { name: "browser" } } as any;

      inject.setGlobalContainer(mockContainer, { autoCleanRequestScope: true });

      expect(containerRegistry.setDefaultContainer).toHaveBeenCalledWith(
        mockContainer,
      );
      expect(mockProcess.on).not.toHaveBeenCalled();
    });

    it("should not set up auto clean if process is undefined", () => {
      global.process = undefined as any;

      inject.setGlobalContainer(mockContainer, { autoCleanRequestScope: true });

      expect(containerRegistry.setDefaultContainer).toHaveBeenCalledWith(
        mockContainer,
      );
    });
  });

  describe("getGlobalContainer", () => {
    it("should return the global container if it exists", () => {
      vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(true);
      vi.mocked(containerRegistry.getContainer).mockReturnValue(mockContainer);

      const result = inject.getGlobalContainer();

      expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
      expect(containerRegistry.getContainer).toHaveBeenCalled();
      expect(result).toBe(mockContainer);
    });

    it("should throw an error if no global container is defined", () => {
      vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(false);

      expect(() => inject.getGlobalContainer()).toThrow(
        "No global container defined. Use inject.setGlobalContainer() first.",
      );
      expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
      expect(containerRegistry.getContainer).not.toHaveBeenCalled();
    });
  });

  describe("resolve", () => {
    it("should resolve a dependency from the global container", () => {
      const token = "TestService";
      const resolvedValue = { test: "value" };

      vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(true);
      vi.mocked(containerRegistry.getContainer).mockReturnValue(mockContainer);
      vi.mocked(mockContainer.resolve).mockReturnValue(resolvedValue);

      const result = inject.resolve(token);

      expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
      expect(containerRegistry.getContainer).toHaveBeenCalled();
      expect(mockContainer.resolve).toHaveBeenCalledWith(token);
      expect(result).toBe(resolvedValue);
    });
  });

  describe("resolveAsync", () => {
    it("should resolve a dependency asynchronously from the global container", async () => {
      const token = "TestService";
      const resolvedValue = { test: "value" };

      vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(true);
      vi.mocked(containerRegistry.getContainer).mockReturnValue(mockContainer);
      vi.mocked(mockContainer.resolveAsync).mockResolvedValue(resolvedValue);

      const result = await inject.resolveAsync(token);

      expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
      expect(containerRegistry.getContainer).toHaveBeenCalled();
      expect(mockContainer.resolveAsync).toHaveBeenCalledWith(token);
      expect(result).toBe(resolvedValue);
    });
  });

  describe("clearRequestScope", () => {
    it("should clear the request scope of the global container", () => {
      vi.mocked(containerRegistry.hasDefaultContainer).mockReturnValue(true);
      vi.mocked(containerRegistry.getContainer).mockReturnValue(mockContainer);

      inject.clearRequestScope();

      expect(containerRegistry.hasDefaultContainer).toHaveBeenCalled();
      expect(containerRegistry.getContainer).toHaveBeenCalled();
      expect(mockContainer.clearRequestScope).toHaveBeenCalled();
    });
  });
});
