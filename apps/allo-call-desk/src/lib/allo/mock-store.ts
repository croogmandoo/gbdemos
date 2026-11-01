import { matchesKeyword } from "./keyword";
import { MOCK_ITEMS, MOCK_LINE, MOCK_NOTES, MOCK_PEOPLE, SCRIPTED_EVENTS } from "./mock-data";
import { publish } from "./bus";
import { searchableText } from "./format";
import type {
  ConversationItem,
  ConversationNote,
  ConversationSummary,
  CrmPerson,
  FeedTopic,
  TranscriptEntry,
} from "./types";

type MockState = {
  items: ConversationItem[];
  notes: ConversationNote[];
  people: CrmPerson[];
  scriptIndex: number;
};

const globalState = globalThis as typeof globalThis & { __alloMock?: MockState };

function state(): MockState {
  if (!globalState.__alloMock) {
    globalState.__alloMock = {
      items: MOCK_ITEMS.map((item) => ({ ...item, contacts: item.contacts.map((contact) => ({ ...contact })) })),
      notes: MOCK_NOTES.map((note) => ({ ...note })),
      people: MOCK_PEOPLE.map((person) => ({
        ...person,
        numbers: [...person.numbers],
        emails: [...person.emails],
        custom_attributes: { ...person.custom_attributes },
      })),
      scriptIndex: 0,
    };
  }
  return globalState.__alloMock;
}

export function mockPeople(): CrmPerson[] {
  return state().people;
}

export function mockItems(): ConversationItem[] {
  return state().items;
}

export function mockNotes(contactNumber?: string): ConversationNote[] {
  const notes = state().notes;
  const filtered = contactNumber
    ? notes.filter((note) => note.contact_number === contactNumber)
    : notes;
  return [...filtered].sort((a, b) => b.created_at.localeCompare(a.created_at));
}

export function mockConversations(): ConversationSummary[] {
  const grouped = new Map<string, ConversationItem[]>();
  for (const item of state().items) {
    const list = grouped.get(item.contact_number) ?? [];
    list.push(item);
    grouped.set(item.contact_number, list);
  }

  const conversations: ConversationSummary[] = [];
  for (const [contactNumber, items] of grouped) {
    const ordered = [...items].sort((a, b) => b.date.localeCompare(a.date));
    const last = ordered[0];
    if (!last) continue;
    conversations.push({
      contact_number: contactNumber,
      contacts: last.contacts,
      last_activity: last.date,
      last_item: {
        id: last.id,
        type: last.type,
        direction: last.direction,
        date: last.date,
        summary: last.summary,
        content: last.content,
        result: last.result,
        duration: last.duration,
      },
      pinned: false,
      allo_number: last.allo_number,
    });
  }

  return conversations.sort((a, b) => b.last_activity.localeCompare(a.last_activity));
}

export function mockTimeline(contactNumber: string): ConversationItem[] {
  return state()
    .items.filter((item) => item.contact_number === contactNumber)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function mockSearch(query: string): ConversationItem[] {
  return state()
    .items.filter((item) => matchesKeyword(searchableText(item), query))
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function mockFindPerson(phoneNumber: string): CrmPerson | null {
  return (
    state().people.find((person) => person.numbers.includes(phoneNumber)) ?? null
  );
}

export function mockAddNote(contactNumber: string, content: string): ConversationNote {
  const now = new Date().toISOString();
  const note: ConversationNote = {
    id: `not-${Date.now()}`,
    content,
    contact_number: contactNumber,
    allo_number: MOCK_LINE.number,
    user: { id: "usr-alex", name: "Alex Kim" },
    created_at: now,
    updated_at: now,
  };
  state().notes.unshift(note);
  return note;
}

export function mockSendSms(to: string, message: string): ConversationItem {
  const person = mockFindPerson(to);
  const item: ConversationItem = {
    id: `msg-out-${Date.now()}`,
    type: "SMS",
    direction: "OUTBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: to,
    contacts: person
      ? [
          {
            id: person.id.replace("per-", "cnt-"),
            name: `${person.name ?? ""} ${person.last_name ?? ""}`.trim(),
            company: person.company,
          },
        ]
      : [],
    user: { id: "usr-alex", name: "Alex Kim", email: "alex@northline.example" },
    date: new Date().toISOString(),
    duration: null,
    result: null,
    summary: null,
    tags: null,
    transcript: null,
    content: message,
    status: "SENT",
    message_type: "SMS",
  };
  state().items.push(item);
  return item;
}

function asString(value: unknown): string | null {
  return typeof value === "string" && value.length > 0 ? value : null;
}

function contactsFor(number: string, fallbackName: string | null) {
  const person = mockFindPerson(number);
  if (person) {
    return [
      {
        id: person.id.replace("per-", "cnt-"),
        name: `${person.name ?? ""} ${person.last_name ?? ""}`.trim(),
        company: person.company,
      },
    ];
  }
  if (!fallbackName) return [];
  return [{ id: `cnt-${number}`, name: fallbackName, company: null }];
}

export function applyMockDelivery(topic: FeedTopic, data: Record<string, unknown>) {
  if (topic === "sms.received") {
    const from = asString(data.from_number);
    const id = asString(data.id);
    const content = asString(data.content);
    if (!from || !id || !content) return;
    if (state().items.some((item) => item.id === id)) return;
    state().items.push({
      id,
      type: "SMS",
      direction: "INBOUND",
      allo_number: asString(data.to_number) ?? MOCK_LINE.number,
      contact_number: from,
      contacts: contactsFor(from, asString(data.from_name)),
      user: { id: "usr-alex", name: "Alex Kim" },
      date: asString(data.sent_at) ?? new Date().toISOString(),
      duration: null,
      result: null,
      summary: null,
      tags: null,
      transcript: null,
      content,
      status: "DELIVERED",
      message_type: "SMS",
    });
    return;
  }

  if (topic === "call.completed") {
    const id = asString(data.id);
    const direction = data.type === "OUTBOUND" ? "OUTBOUND" : "INBOUND";
    const from = asString(data.from_number);
    const to = asString(data.to);
    if (!id || !from || !to) return;
    if (state().items.some((item) => item.id === id)) return;
    const contactNumber = direction === "INBOUND" ? from : to;
    const alloNumber = direction === "INBOUND" ? to : from;
    const transcriptions = Array.isArray(data.transcriptions) ? data.transcriptions : [];
    const transcript: TranscriptEntry[] = transcriptions.flatMap((entry) => {
      if (!entry || typeof entry !== "object") return [];
      const record = entry as Record<string, unknown>;
      const text = asString(record.text);
      const time = asString(record.time);
      if (!text || !time) return [];
      return [
        {
          source: record.source === "USER" ? "USER" : "EXTERNAL",
          time,
          text,
        },
      ];
    });
    const minutes = typeof data.length_in_minutes === "number" ? data.length_in_minutes : 0;
    state().items.push({
      id,
      type: "CALL",
      direction,
      allo_number: alloNumber,
      contact_number: contactNumber,
      contacts: contactsFor(
        contactNumber,
        direction === "INBOUND" ? asString(data.from_name) : asString(data.to_name),
      ),
      user: { id: "usr-alex", name: "Alex Kim" },
      date: asString(data.start_date) ?? new Date().toISOString(),
      duration: Math.round(minutes * 60),
      result: (typeof data.result === "string" ? data.result : "ANSWERED") as ConversationItem["result"],
      summary: asString(data.summary),
      tags: null,
      transcript: transcript.length > 0 ? transcript : null,
      content: null,
      status: null,
      message_type: null,
    });
  }
}

export function pushScriptedEvent(): { topic: FeedTopic; id: string } | null {
  const current = state();
  const scripted = SCRIPTED_EVENTS[current.scriptIndex % SCRIPTED_EVENTS.length];
  if (!scripted) return null;
  current.scriptIndex += 1;
  const receivedAt = new Date().toISOString();
  const fresh = {
    ...scripted,
    id: `${scripted.id}-${current.scriptIndex}`,
    timestamp: receivedAt,
  };
  applyMockDelivery(fresh.topic, fresh.data);
  publish({
    id: fresh.id,
    topic: fresh.topic,
    version: "2.0",
    timestamp: fresh.timestamp,
    receivedAt,
    data: fresh.data,
  });
  return { topic: fresh.topic, id: fresh.id };
}
