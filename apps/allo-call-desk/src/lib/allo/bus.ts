import type { FeedEvent, FeedTopic } from "./types";

type Listener = (event: FeedEvent) => void;

type Bus = {
  events: FeedEvent[];
  listeners: Set<Listener>;
  seenIds: Set<string>;
};

const globalBus = globalThis as typeof globalThis & { __alloBus?: Bus };

function bus(): Bus {
  if (!globalBus.__alloBus) {
    globalBus.__alloBus = {
      events: [],
      listeners: new Set(),
      seenIds: new Set(),
    };
  }
  return globalBus.__alloBus;
}

export function recentEvents(): FeedEvent[] {
  return bus().events;
}

export function subscribe(listener: Listener): () => void {
  const current = bus();
  current.listeners.add(listener);
  return () => {
    current.listeners.delete(listener);
  };
}

/** Returns false when this delivery id was already accepted. */
export function publish(event: FeedEvent): boolean {
  const current = bus();
  if (current.seenIds.has(event.id)) return false;
  current.seenIds.add(event.id);
  current.events = [event, ...current.events].slice(0, 40);
  for (const listener of current.listeners) {
    listener(event);
  }
  return true;
}

export function isFeedTopic(value: unknown): value is FeedTopic {
  return value === "call.received" || value === "sms.received" || value === "call.completed";
}
