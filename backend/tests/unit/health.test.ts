import { describe, it, expect } from "vitest";
import { createApp } from "../../src/app.js";

describe("Health Endpoint", () => {
  it("GET /health returns 200 with status ok and timestamp", async () => {
    const app = createApp();

    const server = app.listen(0);
    const address = server.address();
    const port = typeof address === "object" && address ? address.port : 0;

    try {
      const res = await fetch(`http://localhost:${port}/health`);
      expect(res.status).toBe(200);

      const json = await res.json();
      expect(json).toHaveProperty("status", "ok");
      expect(json).toHaveProperty("service", "api");
      expect(json).toHaveProperty("timestamp");

      // Ensure no sensitive info is leaked
      expect(json).not.toHaveProperty("env");
      expect(json).not.toHaveProperty("config");
      expect(json).not.toHaveProperty("uri");
      expect(json).not.toHaveProperty("secret");
    } finally {
      server.close();
    }
  });
});
