import { pushScriptedEvent } from "./mock-store";

const globalTimer = globalThis as typeof globalThis & { __alloMockTimer?: boolean };

/** Plays call.received, sms.received, and call.completed into the same bus as webhooks. */
export function ensureMockStream() {
  if (process.env.ALLO_API_KEY) return;
  if (process.env.NEXT_PHASE === "phase-production-build") return;
  if (globalTimer.__alloMockTimer) return;
  globalTimer.__alloMockTimer = true;

  const tick = () => {
    pushScriptedEvent();
  };
  setTimeout(tick, 4000);
  setInterval(tick, 12000);
}
