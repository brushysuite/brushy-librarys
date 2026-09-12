import { server } from "@brushy/di-core";
import express from "express";
import { container } from "./app/container.js";
import { registerRoutes } from "./routes/index.js";

export function createApp() {
  server.setServerContainer(container);

  const app = express();
  app.use(server.brushyRequestScope());
  registerRoutes(app);

  return app;
}
