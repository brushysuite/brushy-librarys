import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { server } from "../server";
import { Container } from "../../../core/container";

let originalServerContainer: any = null;

describe("server", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    originalServerContainer = (server as any).serverContainer;

    (server as any).serverContainer = null;
  });

  afterEach(() => {
    (server as any).serverContainer = originalServerContainer;
  });

  describe("setServerContainer", () => {
    it("should set the container as the server's global container", () => {
      const mockContainer = {} as Container;

      server.setServerContainer(mockContainer);

      expect(server.getServerContainer()).toBe(mockContainer);
    });
  });

  describe("getServerContainer", () => {
    it("should return the server's global container if it exists", () => {
      const mockContainer = {} as Container;
      server.setServerContainer(mockContainer);

      const result = server.getServerContainer();

      expect(result).toBe(mockContainer);
    });
  });

  describe("resolve", () => {
    it("should resolve a dependency from the server's container", () => {
      const token = "TestService";
      const resolvedValue = { test: "value" };
      const mockContainer = {
        resolve: vi.fn().mockReturnValue(resolvedValue),
      } as unknown as Container;

      server.setServerContainer(mockContainer);

      const result = server.resolve(token);

      expect(mockContainer.resolve).toHaveBeenCalledWith(token);
      expect(result).toBe(resolvedValue);
    });
  });

  describe("resolveAsync", () => {
    it("should resolve a dependency asynchronously from the server's container", async () => {
      const token = "TestService";
      const resolvedValue = { test: "value" };
      const mockContainer = {
        resolveAsync: vi.fn().mockResolvedValue(resolvedValue),
      } as unknown as Container;

      server.setServerContainer(mockContainer);

      const result = await server.resolveAsync(token);

      expect(mockContainer.resolveAsync).toHaveBeenCalledWith(token);
      expect(result).toBe(resolvedValue);
    });
  });

  describe("clearRequestScope", () => {
    it("should clear the request scope of the server's container", () => {
      const mockContainer = {
        clearRequestScope: vi.fn(),
      } as unknown as Container;

      server.setServerContainer(mockContainer);

      server.clearRequestScope();

      expect(mockContainer.clearRequestScope).toHaveBeenCalled();
    });
  });
});
