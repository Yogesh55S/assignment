import { describe, it, expect } from "vitest";
import http from "node:http";
import { createApp } from "../../src/app.js";

describe("Protected Routes Authentication & Error Schema", () => {
  it("returns 401 with structured error payload for unauthenticated GET /api/kits", async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await new Promise<{ status: number; body: Record<string, any> }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/kits`, (res) => {
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

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error).toHaveProperty("code", "UNAUTHORIZED");
    expect(response.body.error).toHaveProperty("message");
    expect(response.body.error).toHaveProperty("requestId");
  });

  it("returns 401 with structured error payload for unauthenticated GET /api/auth/me", async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await new Promise<{ status: number; body: Record<string, any> }>((resolve, reject) => {
      http.get(`http://127.0.0.1:${port}/api/auth/me`, (res) => {
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

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty("error");
    expect(response.body.error.code).toBe("UNAUTHORIZED");
    expect(response.body.error.requestId).toBeDefined();
  });
});
