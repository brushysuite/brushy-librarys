import { server } from "@brushy/di-core";
import type { Express } from "express";
import { USER_SERVICE } from "./users.tokens.js";

export function registerUsersRoutes(app: Express): void {
  app.get("/users", (_req, res) => {
    const users = server.resolve(USER_SERVICE);
    res.json(users.list());
  });
}
