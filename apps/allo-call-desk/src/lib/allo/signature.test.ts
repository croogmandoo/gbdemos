import { describe, expect, test } from "bun:test";
import { signWebhook, verifyAlloSignature } from "./signature";

const SECRET = "whsec_YWxsby1jYWxsLWRlc2stbW9jay1rZXk=";
const BODY = JSON.stringify({
  topic: "sms.received",
  version: "2.0",
  timestamp: "2026-11-01T18:00:00.000Z",
  data: { id: "msg_1", content: "Hello" },
});
const NOW = 1_762_000_000;

function headers(signature: string, timestamp = String(NOW)) {
  return {
    id: "msg_delivery_1",
    timestamp,
    signature,
  };
}

describe("verifyAlloSignature", () => {
  test("accepts a signature over the raw body", () => {
    const signature = signWebhook(BODY, "msg_delivery_1", String(NOW), SECRET);
    const result = verifyAlloSignature({
      rawBody: BODY,
      headers: headers(signature),
      secret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: true });
  });

  test("rejects a re-serialized body", () => {
    const signature = signWebhook(BODY, "msg_delivery_1", String(NOW), SECRET);
    const result = verifyAlloSignature({
      rawBody: BODY + " ",
      headers: headers(signature),
      secret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "invalid_signature" });
  });

  test("rejects a timestamp outside the five-minute window", () => {
    const stale = String(NOW - 301);
    const signature = signWebhook(BODY, "msg_delivery_1", stale, SECRET);
    const result = verifyAlloSignature({
      rawBody: BODY,
      headers: headers(signature, stale),
      secret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: false, reason: "stale_timestamp" });
  });

  test("accepts the matching signature when a previous secret is still listed", () => {
    const current = signWebhook(BODY, "msg_delivery_1", String(NOW), SECRET);
    const result = verifyAlloSignature({
      rawBody: BODY,
      headers: headers(`v1,bm90LXRoZS1zaWduYXR1cmU ${current}`),
      secret: SECRET,
      nowSeconds: NOW,
    });
    expect(result).toEqual({ ok: true });
  });

  test("rejects a missing header and a secret without the whsec_ prefix", () => {
    const signature = signWebhook(BODY, "msg_delivery_1", String(NOW), SECRET);
    expect(
      verifyAlloSignature({
        rawBody: BODY,
        headers: { id: null, timestamp: String(NOW), signature },
        secret: SECRET,
        nowSeconds: NOW,
      }),
    ).toEqual({ ok: false, reason: "missing_headers" });

    expect(
      verifyAlloSignature({
        rawBody: BODY,
        headers: headers(signature),
        secret: "plain-secret",
        nowSeconds: NOW,
      }),
    ).toEqual({ ok: false, reason: "bad_secret" });
  });
});
