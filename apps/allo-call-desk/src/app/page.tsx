import Link from "next/link";
import { connection } from "next/server";
import { LiveFeed } from "@/components/desk/live-feed";
import { NoteForm } from "@/components/desk/note-form";
import { SmsReply } from "@/components/desk/sms-reply";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { loadDesk } from "@/lib/allo/desk";
import { ensureMockStream } from "@/lib/allo/mock-stream";
import {
  contactCompany,
  contactName,
  formatDuration,
  formatPhone,
  formatWhen,
  itemPreview,
  personName,
  resultLabel,
} from "@/lib/allo/format";

function one(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] ?? "" : value ?? "";
}

export default async function Page({ searchParams }: PageProps<"/">) {
  await connection();
  ensureMockStream();
  const params = await searchParams;
  const query = one(params.q).trim();
  const contact = one(params.contact);
  const desk = await loadDesk({ contact, query });
  const selected = desk.conversations.find((item) => item.contact_number === desk.selected) ?? null;
  const callback = desk.callbacks.find((item) => item.contactNumber === desk.selected) ?? null;
  const canSend = desk.line.capabilities.includes("SMS");

  return (
    <div className="flex h-svh flex-col bg-background">
      <header className="flex items-end justify-between gap-4 border-b border-border px-5 py-4">
        <div>
          <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
            Allo
          </p>
          <h1 className="font-heading text-3xl tracking-wider uppercase">Call desk</h1>
        </div>
        <div className="text-right">
          <Badge variant={desk.mode === "mock" ? "destructive" : "default"}>
            {desk.headline}
          </Badge>
          <p className="mt-1 text-sm text-muted-foreground">
            {desk.line.number ? `${desk.line.name} · ${formatPhone(desk.line.number)}` : "No line"}
          </p>
        </div>
      </header>

      <div
        className={
          desk.mode === "mock"
            ? "border-b border-border bg-muted px-5 py-2 text-sm"
            : "border-b border-border px-5 py-2 text-sm"
        }
      >
        <p>{desk.detail}</p>
        {desk.warning ? <p className="text-destructive">{desk.warning}</p> : null}
        {desk.error ? <p className="text-destructive">{desk.error}</p> : null}
      </div>

      <div className="grid min-h-0 flex-1 lg:grid-cols-[18rem_minmax(0,1fr)_22rem]">
        <section className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
          <form action="/" className="grid gap-2 px-5 py-4">
            <label htmlFor="q" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
              Search transcripts
            </label>
            <Input id="q" name="q" defaultValue={desk.query} placeholder="boiler, invoice, parts" />
          </form>
          <Separator />
          <div className="min-h-0 flex-1 overflow-y-auto">
            {desk.conversations.length === 0 ? (
              <p className="px-5 py-4 text-sm text-muted-foreground">No conversations on this line.</p>
            ) : (
              <ul>
                {desk.conversations.map((conversation) => {
                  const active = conversation.contact_number === desk.selected;
                  return (
                    <li key={conversation.contact_number}>
                      <Link
                        href={`/?contact=${encodeURIComponent(conversation.contact_number)}`}
                        className={
                          active
                            ? "grid gap-1 border-b border-border bg-muted px-5 py-4"
                            : "grid gap-1 border-b border-border px-5 py-4 hover:bg-muted/60"
                        }
                      >
                        <span className="flex items-baseline justify-between gap-3">
                          <span className="font-medium">
                            {contactName(conversation.contacts, conversation.contact_number)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {formatWhen(conversation.last_activity)}
                          </span>
                        </span>
                        <span className="text-xs tracking-widest text-muted-foreground uppercase">
                          {conversation.last_item.type === "CALL" ? "Call" : "SMS"}
                          {conversation.last_item.direction === "OUTBOUND" ? " out" : " in"}
                        </span>
                        <span className="line-clamp-2 text-sm text-muted-foreground">
                          {itemPreview(conversation.last_item)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </section>

        <section className="flex min-h-0 flex-col border-b border-border lg:border-r lg:border-b-0">
          {desk.query ? (
            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              <div className="mb-4 flex items-baseline justify-between gap-3">
                <h2 className="font-heading text-2xl tracking-wider uppercase">
                  {desk.hits.length} match{desk.hits.length === 1 ? "" : "es"}
                </h2>
                <Link href={desk.selected ? `/?contact=${encodeURIComponent(desk.selected)}` : "/"} className="text-sm underline underline-offset-4">
                  Clear search
                </Link>
              </div>
              {desk.hits.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Nothing in the transcripts, summaries, or texts matches “{desk.query}”.
                </p>
              ) : (
                <ul className="grid gap-4">
                  {desk.hits.map((hit) => (
                    <li key={hit.id} className="border-b border-border pb-4">
                      <Link href={`/?contact=${encodeURIComponent(hit.contact_number)}`} className="grid gap-1">
                        <span className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                          {hit.type === "CALL" ? "Call" : "SMS"} · {formatWhen(hit.date)}
                        </span>
                        <span className="font-medium">
                          {contactName(hit.contacts, hit.contact_number)}
                        </span>
                        <span className="text-sm">{itemPreview(hit)}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : selected ? (
            <>
              <div className="px-5 py-4">
                <h2 className="font-heading text-2xl tracking-wider uppercase">
                  {contactName(selected.contacts, selected.contact_number)}
                </h2>
                <p className="text-sm text-muted-foreground">
                  {formatPhone(selected.contact_number)}
                  {contactCompany(selected.contacts) ? ` · ${contactCompany(selected.contacts)}` : ""}
                </p>
              </div>
              <Separator />
              <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                {desk.timeline.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No calls or texts yet.</p>
                ) : (
                  <ol className="grid gap-6">
                    {desk.timeline.map((item) => (
                      <li key={item.id} className="grid gap-2 border-b border-border pb-6">
                        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                          {item.type === "CALL" ? "Call" : "SMS"}
                          {item.direction === "OUTBOUND" ? " out" : " in"}
                          {" · "}
                          {formatWhen(item.date)}
                          {item.result ? ` · ${resultLabel(item.result)}` : ""}
                          {formatDuration(item.duration) ? ` · ${formatDuration(item.duration)}` : ""}
                        </p>
                        {item.summary ? <p>{item.summary}</p> : null}
                        {item.content ? <p className="whitespace-pre-wrap">{item.content}</p> : null}
                        {item.transcript && item.transcript.length > 0 ? (
                          <div className="grid gap-2">
                            {item.transcript.map((entry) => (
                              <p key={`${entry.time}-${entry.text}`} className="text-sm">
                                <span className="text-muted-foreground">
                                  {entry.source === "USER"
                                    ? "You"
                                    : contactName(item.contacts, item.contact_number)}
                                  :{" "}
                                </span>
                                {entry.text}
                              </p>
                            ))}
                          </div>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
                {desk.notes.length > 0 ? (
                  <div className="mt-6 grid gap-3">
                    <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                      Notes
                    </h3>
                    {desk.notes.map((note) => (
                      <article key={note.id} className="grid gap-1">
                        <p className="text-xs text-muted-foreground">
                          {note.user.name} · {formatWhen(note.created_at)}
                        </p>
                        <p className="text-sm whitespace-pre-wrap">{note.content}</p>
                      </article>
                    ))}
                  </div>
                ) : null}
              </div>
              {desk.selected ? (
                <SmsReply to={desk.selected} from={desk.line.number} canSend={canSend && !desk.error} />
              ) : null}
            </>
          ) : (
            <p className="px-5 py-5 text-sm text-muted-foreground">Select a conversation.</p>
          )}
        </section>

        <aside className="min-h-0 overflow-y-auto">
          <section className="grid gap-4 px-5 py-5">
            <h2 className="font-heading text-lg tracking-wider uppercase">Callbacks</h2>
            <p className="text-sm text-muted-foreground">
              Inbound calls that were missed, hung up, or went to voicemail.
            </p>
            {desk.callbacks.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nobody is waiting on a callback.</p>
            ) : (
              <ul className="grid gap-3">
                {desk.callbacks.map((row) => (
                  <li key={row.contactNumber}>
                    <Link
                      href={`/?contact=${encodeURIComponent(row.contactNumber)}`}
                      className={
                        row.contactNumber === desk.selected
                          ? "grid gap-1 bg-muted px-3 py-3"
                          : "grid gap-1 px-3 py-3 hover:bg-muted/60"
                      }
                    >
                      <span className="font-medium">{row.name}</span>
                      <span className="text-xs tracking-widest text-muted-foreground uppercase">
                        {row.reason} · {formatWhen(row.when)}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {row.company ?? "No company"} · {row.person ? "CRM record" : "No CRM record"}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}

            {callback ? (
              <div className="grid gap-4 border-t border-border pt-4">
                <h3 className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
                  CRM record
                </h3>
                {callback.person ? (
                  <dl className="grid gap-2 text-sm">
                    <div>
                      <dt className="text-muted-foreground">Name</dt>
                      <dd>{personName(callback.person)}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Title</dt>
                      <dd>{callback.person.job_title ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Company</dt>
                      <dd>{callback.person.company?.name ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Email</dt>
                      <dd>{callback.person.emails[0] ?? "—"}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Phone</dt>
                      <dd>{callback.person.numbers.map((number) => formatPhone(number)).join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-muted-foreground">Interactions</dt>
                      <dd>{callback.person.interactions}</dd>
                    </div>
                    {Object.entries(callback.person.custom_attributes).map(([key, value]) => (
                      <div key={key}>
                        <dt className="text-muted-foreground">{key.replaceAll("_", " ")}</dt>
                        <dd>{String(value)}</dd>
                      </div>
                    ))}
                    {callback.deals.length > 0 ? (
                      <div>
                        <dt className="text-muted-foreground">Deals on the conversation</dt>
                        <dd>
                          {callback.deals.map((deal) => `${deal.name} (${deal.status})`).join(", ")}
                        </dd>
                      </div>
                    ) : null}
                  </dl>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No CRM person matches {formatPhone(callback.contactNumber)}.
                  </p>
                )}
                <NoteForm contactNumber={callback.contactNumber} />
              </div>
            ) : null}
          </section>
          <LiveFeed initial={desk.events} mock={desk.mode === "mock"} />
        </aside>
      </div>
    </div>
  );
}
