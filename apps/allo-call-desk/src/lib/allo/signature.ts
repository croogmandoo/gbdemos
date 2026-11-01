import { createHmac, timingSafeEqual } from "node:crypto";

/** Allo rejects deliveries whose timestamp is more than five minutes off. */
export const SIGNATURE_TOLERANCE_SECONDS = 300;

export type SignatureHeaders = {
  id: string | null;
  timestamp: string | null;
  signature: string | null;
};

export type VerifyResult =
  | { ok: true }
  | {
      ok: false;
      reason:
        | "missing_headers"
        | "stale_timestamp"
        | "invalid_signature"
        | "bad_secret";
    };

/**
 * Verify an Allo webhook the way the docs describe it:
 * signed content is `{webhook-id}.{webhook-timestamp}.{raw_body}`,
 * the key is the base64 blob after the `whsec_` prefix, and
 * `webhook-signature` may hold several space-separated `v1,` signatures.
 */
export function verifyAlloSignature(input: {
  rawBody: string;
  headers: SignatureHeaders;
  secret: string;
  nowSeconds?: number;
}): VerifyResult {
  const { rawBody, headers, secret } = input;
  if (!headers.id || !headers.timestamp || !headers.signature) {
    return { ok: false, reason: "missing_headers" };
  }

  const timestamp = Number(headers.timestamp);
  const now = input.nowSeconds ?? Math.floor(Date.now() / 1000);
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > SIGNATURE_TOLERANCE_SECONDS) {
    return { ok: false, reason: "stale_timestamp" };
  }

  const secretBytes = decodeSigningSecret(secret);
  if (!secretBytes) {
    return { ok: false, reason: "bad_secret" };
  }

  const signed = `${headers.id}.${headers.timestamp}.${rawBody}`;
  const computed = createHmac("sha256", secretBytes).update(signed).digest("base64");
  const computedBuf = Buffer.from(computed);
  const candidates = headers.signature
    .split(" ")
    .map((part) => {
      const comma = part.indexOf(",");
      if (comma === -1) return "";
      return part.slice(comma + 1);
    })
    .filter((part) => part.length > 0);

  const match = candidates.some((candidate) => {
    const received = Buffer.from(candidate);
    if (received.length !== computedBuf.length) return false;
    return timingSafeEqual(received, computedBuf);
  });

  return match ? { ok: true } : { ok: false, reason: "invalid_signature" };
}

export function signWebhook(
  rawBody: string,
  id: string,
  timestamp: string,
  secret: string,
): string {
  const secretBytes = decodeSigningSecret(secret);
  if (!secretBytes) {
    throw new Error("Signing secret must start with whsec_");
  }
  const signed = `${id}.${timestamp}.${rawBody}`;
  const computed = createHmac("sha256", secretBytes).update(signed).digest("base64");
  return `v1,${computed}`;
}

function decodeSigningSecret(secret: string): Buffer | null {
  if (!secret.startsWith("whsec_")) return null;
  const encoded = secret.slice("whsec_".length);
  if (!encoded) return null;
  const bytes = Buffer.from(encoded, "base64");
  if (bytes.length === 0) return null;
  return bytes;
}
