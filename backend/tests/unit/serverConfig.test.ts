import { describe, it, expect } from "vitest";
import { getServerPort, getServerHost } from "../../src/server.js";

describe("Server Binding Configuration", () => {
  it("uses process.env.PORT when available and valid", () => {
    expect(getServerPort("8080")).toBe(8080);
    expect(getServerPort(3001)).toBe(3001);
  });

  it("falls back to 5000 when PORT is missing, invalid, or zero", () => {
    expect(getServerPort(undefined)).toBe(5000);
    expect(getServerPort("")).toBe(5000);
    expect(getServerPort("invalid")).toBe(5000);
    expect(getServerPort("-5")).toBe(5000);
  });

  it("binds to 0.0.0.0 for multi-platform container compatibility", () => {
    expect(getServerHost()).toBe("0.0.0.0");
  });
});
