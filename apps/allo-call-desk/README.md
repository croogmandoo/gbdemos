# Allo Call Desk

A single-user desk for one [Allo](https://www.withallo.com) line. It shows the call and SMS timeline, the people who still need a callback, and a live stream of `call.received`, `sms.received`, and `call.completed`. An SMS reply is drafted first and sent only after an explicit confirm.

There is no Allo account wired up in this demo. **Mock mode is the default.**

## Run

```bash
cd apps/allo-call-desk
bun install
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

```bash
bun test
```

runs the webhook signature checks.

## Mock mode

Mock mode is on whenever `ALLO_API_KEY` is unset. The header reads **Mock mode** and says that no Allo account is connected.

What you see is seeded for a fictional shop, Northline Heating, on `+1 415 555 0100`:

- An inbox of calls and texts, including transcripts.
- Keyword search across those transcripts, summaries, and texts. Terms are AND'd and matched by prefix, the same rules as `POST /v2/api/conversations/items/search`.
- A callback list: inbound calls whose result is `RECEIVED`, `CLOSED`, or `VOICEMAIL`, each with the CRM person (or a clear “no CRM record”) and an add-note action.
- A live feed. A script posts `call.received`, `sms.received`, and `call.completed` every few seconds. **Push sample event** fires the next one immediately. Those events also land in the inbox when they carry a finished call or a text.

The API key is not required and is never sent to the browser. Notes, sent texts, and scripted events live in process memory and reset when the server restarts.

Webhook deliveries are still signature-checked. With `ALLO_WEBHOOK_SECRET` unset, mock mode uses:

```text
whsec_YWxsby1jYWxsLWRlc2stbW9jay1rZXk=
```

`POST /api/webhooks/allo` expects the raw body plus `webhook-id`, `webhook-timestamp`, and `webhook-signature`, as in [Allo's signature docs](https://help.withallo.com/en/v2/api-reference/webhooks/verifying-signatures).

## Live mode

Copy `.env.example` to `.env.local` and set `ALLO_API_KEY`. Restart `bun run dev`. The server calls `GET /v2/api/me` before anything else. A rejected key stays in live mode and shows the error. It does not fall back to fixtures.

Useful scopes: `CONVERSATIONS_READ`, `CRM_READ`, `NOTES_READ`, `NOTES_WRITE`, `SMS_SEND`, `PHONE_NUMBERS_READ`. The header names any of those the key is missing.

| Desk | Allo API |
| --- | --- |
| Key check | `GET /v2/api/me` |
| Line | `ALLO_NUMBER`, or the first `type: NUMBER` from `GET /v2/api/numbers` |
| Inbox | `GET /v2/api/conversations?allo_number=` |
| Timeline and keyword search | `POST /v2/api/conversations/items/search` (`extend=transcript`, `sort=RELEVANCE` when searching) |
| CRM record | `POST /v2/api/crm/people/search` with `filters.phone_number`, then `GET /v2/api/crm/people/{id}` |
| Add note | `POST /v2/api/conversations/{contact_number}/notes` |
| Send SMS | `POST /v1/api/sms` with `{ from, to, message }` after confirm |
| Live feed | `POST /api/webhooks/allo` verifies the signature, then `GET /api/events` streams the three topics |

Every Allo request uses `Authorization: Api-Key <key>`. The browser only talks to this app.

Point an Allo webhook at `https://<your host>/api/webhooks/allo` for `call.received`, `sms.received`, and `call.completed`, and set `ALLO_WEBHOOK_SECRET` to the `whsec_` value from the create response. This app does not call `POST /v2/api/webhooks` for you. The SMS route is the US number endpoint, so the Allo line and the recipient need to be in the same country.

## Layout

`src/lib/allo/` holds the Allo client, the mock store, and the signature check. `src/app/api/webhooks/allo` and `src/app/api/events` are the webhook and the SSE feed. The desk UI is `src/app/page.tsx`.
