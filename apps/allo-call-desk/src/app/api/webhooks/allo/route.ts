import { isFeedTopic, publish } from "@/lib/allo/bus";
import { applyMockDelivery } from "@/lib/allo/mock-store";
import { verifyAlloSignature } from "@/lib/allo/signature";

export const dynamic = "force-dynamic";

/** Used when ALLO_API_KEY and ALLO_WEBHOOK_SECRET are both unset. */
const MOCK_WEBHOOK_SECRET = "whsec_YWxsby1jYWxsLWRlc2stbW9jay1rZXk=";

function signingSecret(): string | null {
  if (process.env.ALLO_WEBHOOK_SECRET) return process.env.ALLO_WEBHOOK_SECRET;
  if (!process.env.ALLO_API_KEY) return MOCK_WEBHOOK_SECRET;
  return null;
}

export async function POST(request: Request) {
  const rawBody = await request.text();
  const secret = signingSecret();
  if (!secret) {
    return Response.json(
      { error: "ALLO_WEBHOOK_SECRET is not set." },
      { status: 500 },
    );
  }

  const verified = verifyAlloSignature({
    rawBody,
    secret,
    headers: {
      id: request.headers.get("webhook-id"),
      timestamp: request.headers.get("webhook-timestamp"),
      signature: request.headers.get("webhook-signature"),
    },
  });
  if (!verified.ok) {
    return Response.json({ error: verified.reason }, { status: 400 });
  }

  let envelope: { topic?: unknown; timestamp?: unknown; data?: unknown };
  try {
    envelope = JSON.parse(rawBody) as typeof envelope;
  } catch {
    return Response.json({ error: "invalid_json" }, { status: 400 });
  }

  if (!isFeedTopic(envelope.topic)) {
    return Response.json({ ok: true, ignored: true });
  }

  const data =
    envelope.data && typeof envelope.data === "object"
      ? (envelope.data as Record<string, unknown>)
      : {};

  if (!process.env.ALLO_API_KEY) {
    applyMockDelivery(envelope.topic, data);
  }

  const accepted = publish({
    id: request.headers.get("webhook-id") ?? "",
    topic: envelope.topic,
    version: "2.0",
    timestamp:
      typeof envelope.timestamp === "string"
        ? envelope.timestamp
        : new Date().toISOString(),
    receivedAt: new Date().toISOString(),
    data,
  });

  return Response.json({ ok: true, duplicate: !accepted });
}
