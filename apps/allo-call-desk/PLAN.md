# Allo Call Desk

## Goal

A single-user desk for one Allo line: the call and SMS timeline, the people who still need a callback, and a live stream of ringing calls, inbound texts, and finished calls, with an optional SMS reply that sends only after an explicit confirm.

## Single-user MVP

Ships when `ALLO_API_KEY` is unset (mock, the default) and when it is set (live). The browser never receives the key. Live mode checks the key with `GET https://api.withallo.com/v2/api/me` before any other call.

- **Inbox.** `GET /v2/api/conversations?allo_number=` for the list. Opening a contact loads `POST /v2/api/conversations/items/search` with `contact_number`, `extend=transcript`, `sort=DATE_DESC`. A keyword box calls the same search with `search` and `sort=RELEVANCE` (terms AND'd, prefix match, across transcripts, summaries, and SMS content).
- **Callbacks.** Conversations whose latest item is an inbound call with result `RECEIVED`, `CLOSED`, or `VOICEMAIL`. Each row loads the CRM person with `POST /v2/api/crm/people/search` (`filters.phone_number`, exact) and `GET /v2/api/crm/people/{id}`. Add note posts `POST /v2/api/conversations/{contact_number}/notes` with `{ content, allo_number }`.
- **Live feed.** `POST /api/webhooks/allo` verifies the Svix-style signature (`webhook-id`, `webhook-timestamp`, `webhook-signature`, raw body, `whsec_` secret, 5-minute window) and publishes `call.received`, `sms.received`, and `call.completed` to an SSE stream at `GET /api/events`. Mock mode plays a scripted stream of those three topics into the same bus.
- **SMS reply.** Draft, then a confirm dialog. The server action refuses to call `POST /v1/api/sms` unless `confirmed` is true. Body is the Send SMS schema `{ from, to, message }` (not the older common-use-cases shape).
- **Line.** `ALLO_NUMBER`, or the first `type: NUMBER` row from `GET /v2/api/numbers`.

Auth header on every Allo call: `Authorization: Api-Key <key>` (not Bearer).

## Out of scope

Multi-user login, recording playback, placing calls, call flows, tags, threads, deals editing, analytics, the AI receptionist, France sender-ID SMS, registering the webhook with `POST /v2/api/webhooks` (the operator points Allo at this app), and any persistence beyond process memory.

## Tasks

1. Scaffold Next.js, then the mock/live switch and the labelled header (`GET /v2/api/me` in live mode).
2. Inbox list, contact timeline, and transcript keyword search.
3. Callback list with the CRM person and add-note.
4. Signature check, webhook route, SSE feed, and the mock event script.
5. SMS draft plus confirm, then send.
6. README and `.env.example` covering both modes.

## Stack

- **Bun** — required runtime, package manager, and test runner.
- **Next.js (App Router)** via `bunx create-next-app` — one server holds the key, the raw-body webhook, and the SSE route. TanStack Start is a smaller opt-out for raw bodies; Next.js is the documented path for shadcn and server actions.
- **shadcn/ui, Sera preset** — the official minimal style (square, typographic). There is no preset named `minimalist`; Sera is the one the project describes as minimal. Components added as the screens need them.
- **In-memory bus** (`globalThis`) — one user, no database. Webhook deliveries and the mock script share it.
- **`node:crypto` HMAC** — the verification steps in Allo's webhook docs, with no extra SDK.
- **Tests** — `bun test` on the signature function only. No git hooks; the check is one command.

## Deferred

- Creating the Allo webhook from the app. It needs a public HTTPS URL and `WEBHOOKS_READ_WRITE`.
- SQLite or a queue. Memory is enough to demo the desk, and a restart reseeds mock data.
- Paging past the first conversation page, multi-line inboxes, and read/archive actions.
- Person-profile notes (`POST /v2/api/crm/people/{id}/notes`). Conversation notes are the desk action.
- A France SMS path. US `POST /v1/api/sms` is the send.
