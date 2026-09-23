import { describe, it, expect } from "vitest";
import http from "node:http";
import { createApp } from "../../src/app.js";

describe("Public Health Endpoint", () => {
  it("returns HTTP 200 with status ok and valid ISO timestamp", async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await new Promise<{ status: number; body: Record<string, any> }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/health`, (res) => {
        let raw = "";
        res.on("data", (chunk) => (raw += chunk));
        res.on("end", () => {
          try {
            resolve({ status: res.statusCode || 0, body: JSON.parse(raw) });
          } catch (e) {
            reject(e);
          }
        });
      }).on("error", reject);
    });

    server.close();

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      service: "api",
      timestamp: expect.any(String),
    });

    const parsedDate = Date.parse(response.body.timestamp);
    expect(isNaN(parsedDate)).toBe(false);

    // Verify secret safety: no connection strings, secrets, or internal configs
    const serialized = JSON.stringify(response.body);
    expect(serialized).not.toContain("mongodb");
    expect(serialized).not.toContain("JWT");
    expect(serialized).not.toContain("secret");
  });
});
