import { describe, it, expect, vi, beforeEach } from "vitest";

// --- Mocks ---

let subscribedListener: ((data: string) => void) | null = null;
const mockUnsubscribe = vi.fn();
vi.mock("@/lib/sse", () => ({
  sse: {
    subscribe: (listener: (data: string) => void) => {
      subscribedListener = listener;
      return mockUnsubscribe;
    },
  },
}));

// Import route handler AFTER mocks
const { GET } = await import("./route");

// --- Tests ---

describe("GET /api/events", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    subscribedListener = null;
  });

  it("should return SSE response headers", async () => {
    const res = await GET();

    expect(res.headers.get("Content-Type")).toBe("text/event-stream");
    expect(res.headers.get("Cache-Control")).toBe("no-cache");
    expect(res.headers.get("Connection")).toBe("keep-alive");
  });

  it("should return a readable stream", async () => {
    const res = await GET();

    expect(res.body).toBeInstanceOf(ReadableStream);
  });

  it("should forward SSE data to stream", async () => {
    const res = await GET();
    const reader = res.body!.getReader();

    // Trigger SSE message
    const ssePayload = 'event: screen_update\ndata: {"runId":1}\n\n';
    subscribedListener!(ssePayload);

    const { value } = await reader.read();
    const text = new TextDecoder().decode(value);

    expect(text).toBe(ssePayload);

    reader.releaseLock();
  });
});
