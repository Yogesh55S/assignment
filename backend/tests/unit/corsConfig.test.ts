import { describe, it, expect } from "vitest";
import http from "node:http";
import { createApp } from "../../src/app.js";

describe("CORS Configuration & Options Preflight", () => {
  it("allows configured CLIENT_URL with credentials=true", async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await new Promise<{ headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${port}/health`,
        {
          headers: {
            Origin: "http://localhost:3000",
          },
        },
        (res) => resolve({ headers: res.headers })
      );
      req.on("error", reject);
      req.end();
    });

    server.close();

    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
    expect(response.headers["access-control-allow-origin"]).not.toBe("*");
  });

  it("handles OPTIONS preflight requests safely", async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await new Promise<{ status: number; headers: http.IncomingHttpHeaders }>(
      (resolve, reject) => {
        const req = http.request(
          `http://127.0.0.1:${port}/api/kits`,
          {
            method: "OPTIONS",
            headers: {
              Origin: "http://localhost:3000",
              "Access-Control-Request-Method": "POST",
              "Access-Control-Request-Headers": "Content-Type",
            },
          },
          (res) => resolve({ status: res.statusCode || 0, headers: res.headers })
        );
        req.on("error", reject);
        req.end();
      }
    );

    server.close();

    expect([200, 204]).toContain(response.status);
    expect(response.headers["access-control-allow-origin"]).toBe("http://localhost:3000");
    expect(response.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("safely omits CORS header for unauthorized origin", async () => {
    const app = createApp();
    const server = http.createServer(app);

    await new Promise<void>((resolve) => server.listen(0, resolve));
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    const response = await new Promise<{ headers: http.IncomingHttpHeaders }>((resolve, reject) => {
      const req = http.request(
        `http://127.0.0.1:${port}/health`,
        {
          headers: {
            Origin: "https://malicious-site.example.com",
          },
        },
        (res) => resolve({ headers: res.headers })
      );
      req.on("error", reject);
      req.end();
    });

    server.close();

    expect(response.headers["access-control-allow-origin"]).not.toBe("https://malicious-site.example.com");
  });
});
