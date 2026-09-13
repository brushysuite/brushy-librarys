import { afterEach, describe, expect, it, vi } from "vitest";

const listen = vi.fn().mockResolvedValue("http://127.0.0.1:3002");

vi.mock("./app.js", () => ({
  createApp: () => ({ listen }),
}));

describe("server", () => {
  afterEach(() => {
    vi.resetModules();
    listen.mockClear();
  });

  it("listens on port 3002", async () => {
    await import("./server.js");

    expect(listen).toHaveBeenCalledWith({ port: 3002, host: "0.0.0.0" });
  });
});
