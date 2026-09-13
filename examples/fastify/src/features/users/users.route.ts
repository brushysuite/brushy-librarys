import type { Container } from "@brushy/di-core";
import { runInRequestScopeAsync } from "@brushy/di-core";
import type { FastifyInstance } from "fastify";
import { USER_SERVICE } from "./users.tokens.js";

export function registerUsersRoutes(app: FastifyInstance, container: Container): void {
  app.get("/users", async () => {
    const users = await runInRequestScopeAsync(async () => container.resolve(USER_SERVICE), {
      container,
    });
    return users.list();
  });
}
