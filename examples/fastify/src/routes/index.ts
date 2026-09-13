import type { Container } from "@brushy/di-core";
import type { FastifyInstance } from "fastify";
import { registerHealthRoutes } from "../features/health/health.route.js";
import { registerUsersRoutes } from "../features/users/users.route.js";

export function registerRoutes(app: FastifyInstance, container: Container): void {
  registerHealthRoutes(app);
  registerUsersRoutes(app, container);
}
