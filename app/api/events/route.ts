import { sse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();
  let keepaliveTimer: ReturnType<typeof setInterval>;
  let unsubscribeFn: (() => void) | undefined;

  const stream = new ReadableStream({
    start(controller) {
      keepaliveTimer = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 30_000);

      unsubscribeFn = sse.subscribe((data: string) => {
        controller.enqueue(encoder.encode(data));
      });
    },
    cancel() {
      clearInterval(keepaliveTimer);
      unsubscribeFn?.();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
