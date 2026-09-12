import request from "supertest";
import { describe, expect, it } from "vitest";
import { createApp } from "./app.js";

describe("express app", () => {
  const app = createApp();

  it("GET /health returns ok", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("GET /users returns scoped user list", async () => {
    const response = await request(app).get("/users");

    expect(response.status).toBe(200);
    expect(response.body).toEqual([
      { id: "1", name: "Ana" },
      { id: "2", name: "Bruno" },
    ]);
  });
});
