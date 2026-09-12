import type { Express } from "express";
import { registerHealthRoutes } from "../features/health/health.route.js";
import { registerUsersRoutes } from "../features/users/users.route.js";

export function registerRoutes(app: Express): void {
  registerHealthRoutes(app);
  registerUsersRoutes(app);
}
