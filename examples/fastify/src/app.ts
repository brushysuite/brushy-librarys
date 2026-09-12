import Fastify from "fastify";
import { container } from "./app/container.js";
import { registerRoutes } from "./routes/index.js";

export function createApp() {
  const app = Fastify();
  registerRoutes(app, container);
  return app;
}
