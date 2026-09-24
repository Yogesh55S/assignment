import { describe, it, expect } from "vitest";
import http from "node:http";
import { createApp } from "../../src/app.js";

describe("Section 1: Auth & Header Verification Tests", () => {
  it("GET /api/auth/me returns 401 Unauthorized for unauthenticated requests", async () => {
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
  });

  it("Structured error response contains code, message, and requestId without leaking stack traces", async () => {
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

    expect(response.body.error).toHaveProperty("code");
    expect(response.body.error).toHaveProperty("message");
    expect(response.body.error).toHaveProperty("requestId");
    expect(response.body.error).not.toHaveProperty("stack");
  });
});
