import { subscribe } from "@/lib/allo/bus";
import { ensureMockStream } from "@/lib/allo/mock-stream";

export const dynamic = "force-dynamic";

export function GET(request: Request) {
  ensureMockStream();
  const encoder = new TextEncoder();
  let unsubscribe = () => {};
  let ping: ReturnType<typeof setInterval> | undefined;

  const stream = new ReadableStream({
    start(controller) {
      const send = (chunk: string) => {
        try {
          controller.enqueue(encoder.encode(chunk));
        } catch {
          /* The client already went away. */
        }
      };

      unsubscribe = subscribe((event) => {
        send(`data: ${JSON.stringify(event)}\n\n`);
      });
      send(`event: ready\ndata: {"ok":true}\n\n`);
      ping = setInterval(() => send(`: ping\n\n`), 15000);

      const close = () => {
        if (ping) clearInterval(ping);
        unsubscribe();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };
      request.signal.addEventListener("abort", close);
    },
    cancel() {
      if (ping) clearInterval(ping);
      unsubscribe();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
