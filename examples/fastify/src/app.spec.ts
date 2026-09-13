import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("fastify app", () => {
  const app = createApp();

  it("GET /health returns ok", async () => {
    const response = await app.inject({ method: "GET", url: "/health" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({ status: "ok" });
  });

  it("GET /users returns scoped user list", async () => {
    const response = await app.inject({ method: "GET", url: "/users" });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ]);
  });
});
