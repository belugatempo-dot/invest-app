import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { middleware } from "./middleware";

function makeRequest(
  url: string,
  headers: Record<string, string> = {},
): NextRequest {
  return new NextRequest(new URL(url, "http://localhost:8888"), { headers });
}

describe("Auth middleware", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it("allows all requests when AUTH_TOKEN is not set", () => {
    delete process.env.AUTH_TOKEN;
    const res = middleware(makeRequest("/"));
    expect(res.status).toBe(200);
  });

  it("allows requests with valid Bearer header", () => {
    process.env.AUTH_TOKEN = "secret123";
    const res = middleware(
      makeRequest("/", { authorization: "Bearer secret123" }),
    );
    expect(res.status).toBe(200);
  });

  it("allows requests with valid query param", () => {
    process.env.AUTH_TOKEN = "secret123";
    const res = middleware(makeRequest("/?token=secret123"));
    expect(res.status).toBe(200);
  });

  it("rejects requests without token when AUTH_TOKEN is set", async () => {
    process.env.AUTH_TOKEN = "secret123";
    const res = middleware(makeRequest("/"));
    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toBe("Unauthorized");
  });

  it("rejects requests with wrong token", async () => {
    process.env.AUTH_TOKEN = "secret123";
    const res = middleware(
      makeRequest("/", { authorization: "Bearer wrong" }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects requests with wrong query param", async () => {
    process.env.AUTH_TOKEN = "secret123";
    const res = middleware(makeRequest("/?token=wrong"));
    expect(res.status).toBe(401);
  });
});
