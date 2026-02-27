import { sse } from "@/lib/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      // Send keepalive every 30s
      const keepalive = setInterval(() => {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }, 30_000);

      const unsubscribe = sse.subscribe((data: string) => {
        controller.enqueue(encoder.encode(data));
      });

      // Clean up on cancel
      const cleanup = () => {
        clearInterval(keepalive);
        unsubscribe();
      };

      // Handle stream closing
      const originalCancel = stream.cancel?.bind(stream);
      stream.cancel = async (reason) => {
        cleanup();
        if (originalCancel) await originalCancel(reason);
      };
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
