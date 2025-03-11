import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Container, server } from "../index";

describe("Server Module", () => {
  let container: Container;

  beforeEach(() => {
    container = new Container();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    try {
      server.clearRequestScope();
    } catch (error) {}
  });

  describe("Main Methods", () => {
    it("should manage the server container correctly", () => {
      expect(() => server.getServerContainer()).toThrow(
        "No server container defined. Use server.setServerContainer() first.",
      );

      server.setServerContainer(container);
      expect(server.getServerContainer()).toBe(container);
    });

    it("should resolve synchronous dependencies", () => {
      const TOKEN = "TEST_SERVICE";
      const testService = { test: () => "test" };

      container.register(TOKEN, { useValue: testService });
      server.setServerContainer(container);

      const resolved = server.resolve(TOKEN);
      expect(resolved).toBe(testService);
    });

    it("should clear the request scope", () => {
      const clearScopeSpy = vi.spyOn(container, "clearRequestScope");
      server.setServerContainer(container);

      server.clearRequestScope();
      expect(clearScopeSpy).toHaveBeenCalled();
    });
  });

  describe("Integration with Express", () => {
    it("should integrate with request scope middleware", () => {
      server.setServerContainer(container);

      class RequestScopeMiddleware {
        handle(req: any, res: any, next: any) {
          const requestId = "test-request-id";
          req.requestId = requestId;

          server.clearRequestScope();
          next();

          res.on("finish", () => {
            server.clearRequestScope();
          });
        }
      }

      const middleware = new RequestScopeMiddleware();
      const req = {};
      const res = {
        on: vi.fn(),
      };
      const next = vi.fn();

      middleware.handle(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith("finish", expect.any(Function));
      expect((req as any).requestId).toBe("test-request-id");
    });

    it("should support dependency injection in routes", async () => {
      interface UserService {
        getUser(id: number): Promise<{ id: number; name: string }>;
      }

      const userService: UserService = {
        getUser: async (id) => ({ id, name: "Test User" }),
      };

      container.register("USER_SERVICE", { useValue: userService });
      server.setServerContainer(container);

      async function getUserHandler(req: any, res: any) {
        const service = server.resolve<UserService>("USER_SERVICE");
        const user = await service.getUser(1);
        res.json(user);
      }

      const req = {};
      const res = {
        json: vi.fn(),
      };

      await getUserHandler(req, res);

      expect(res.json).toHaveBeenCalledWith({
        id: 1,
        name: "Test User",
      });
    });
  });

  describe("Integration with Next.js", () => {
    it("should support Next.js API routes", async () => {
      interface PostService {
        getPosts(): Promise<Array<{ id: number; title: string }>>;
      }

      const postService: PostService = {
        getPosts: async () => [
          { id: 1, title: "Post 1" },
          { id: 2, title: "Post 2" },
        ],
      };

      container.register("POST_SERVICE", { useValue: postService });
      server.setServerContainer(container);

      async function postsHandler(req: any, res: any) {
        const service = server.resolve<PostService>("POST_SERVICE");
        const posts = await service.getPosts();
        res.status(200).json(posts);
      }

      const req = { method: "GET" };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await postsHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([
        { id: 1, title: "Post 1" },
        { id: 2, title: "Post 2" },
      ]);
    });

    it("should handle errors in API routes", async () => {
      interface ErrorService {
        throwError(): Promise<void>;
      }

      const errorService: ErrorService = {
        throwError: async () => {
          throw new Error("Error test");
        },
      };

      container.register("ERROR_SERVICE", { useValue: errorService });
      server.setServerContainer(container);

      async function errorHandler(req: any, res: any) {
        try {
          const service = server.resolve<ErrorService>("ERROR_SERVICE");
          await service.throwError();
        } catch (error) {
          res.status(500).json({
            error: error instanceof Error ? error.message : "Unknown error",
          });
        }
      }

      const req = { method: "GET" };
      const res = {
        status: vi.fn().mockReturnThis(),
        json: vi.fn(),
      };

      await errorHandler(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: "Error test",
      });
    });
  });
});
