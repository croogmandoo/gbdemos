"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { pushSampleEvent } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { formatPhone, formatWhen } from "@/lib/allo/format";
import type { FeedEvent } from "@/lib/allo/types";

function text(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function eventLine(event: FeedEvent): { who: string; detail: string } {
  const data = event.data;
  if (event.topic === "call.received") {
    const person = data.person as { name?: string; last_name?: string } | null;
    const who =
      [person?.name, person?.last_name].filter(Boolean).join(" ") ||
      formatPhone(text(data.from_number) ?? "Unknown");
    return { who, detail: "Ringing" };
  }
  if (event.topic === "sms.received") {
    return {
      who: text(data.from_name) ?? formatPhone(text(data.from_number) ?? "Unknown"),
      detail: text(data.content) ?? "Text received",
    };
  }
  return {
    who: text(data.from_name) ?? formatPhone(text(data.from_number) ?? "Unknown"),
    detail: text(data.summary) ?? text(data.result) ?? "Call finished",
  };
}

function merge(current: FeedEvent[], incoming: FeedEvent[]): FeedEvent[] {
  const map = new Map<string, FeedEvent>();
  for (const event of [...incoming, ...current]) map.set(event.id, event);
  return [...map.values()]
    .sort((a, b) => b.receivedAt.localeCompare(a.receivedAt))
    .slice(0, 40);
}

export function LiveFeed({
  initial,
  mock,
}: {
  initial: FeedEvent[];
  mock: boolean;
}) {
  const router = useRouter();
  const [live, setLive] = useState<FeedEvent[]>([]);
  const [connected, setConnected] = useState(false);
  const [pending, setPending] = useState(false);
  const events = merge(initial, live);

  useEffect(() => {
    const source = new EventSource("/api/events");
    source.onopen = () => setConnected(true);
    source.onerror = () => setConnected(false);
    source.onmessage = (message) => {
      const event = JSON.parse(message.data) as FeedEvent;
      setLive((current) => merge(current, [event]));
      router.refresh();
    };
    return () => source.close();
  }, [router]);

  return (
    <section className="grid gap-4 border-t border-border px-5 py-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg tracking-wider uppercase">Live</h2>
        <p className="text-xs tracking-widest text-muted-foreground uppercase">
          {connected ? "Connected" : "Connecting"}
        </p>
      </div>
      <p className="text-sm text-muted-foreground">
        call.received, sms.received, and call.completed.
      </p>
      {mock ? (
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={pending}
          onClick={() => {
            setPending(true);
            void pushSampleEvent()
              .then(() => router.refresh())
              .finally(() => setPending(false));
          }}
        >
          {pending ? "Pushing" : "Push sample event"}
        </Button>
      ) : null}
      {events.length === 0 ? (
        <p className="text-sm text-muted-foreground">Waiting for the next event.</p>
      ) : (
        <ol className="grid gap-4">
          {events.map((event) => {
            const line = eventLine(event);
            return (
              <li key={event.id} className="grid gap-1 border-b border-border pb-4">
                <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  {event.topic} · {formatWhen(event.receivedAt)}
                </p>
                <p className="font-medium">{line.who}</p>
                <p className="text-sm text-muted-foreground">{line.detail}</p>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
}
