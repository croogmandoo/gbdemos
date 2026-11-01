import { recentEvents } from "./bus";
import { callbackReason, contactCompany, contactName, isCallbackItem, itemPreview } from "./format";
import { AlloApiError, findLivePerson, listLiveConversations, listLiveNotes, loadLiveAccount, searchLiveItems } from "./live";
import { MOCK_LINE, MOCK_TEAM } from "./mock-data";
import {
  mockConversations,
  mockFindPerson,
  mockNotes,
  mockSearch,
  mockTimeline,
} from "./mock-store";
import type { CallbackRow, ConversationSummary, DeskSnapshot, LineInfo } from "./types";

export function isLiveMode(): boolean {
  return Boolean(process.env.ALLO_API_KEY);
}

async function callbacksFrom(
  conversations: ConversationSummary[],
  personFor: (phone: string) => Promise<CallbackRow["person"]>,
): Promise<CallbackRow[]> {
  const pending = conversations.filter((conversation) => isCallbackItem(conversation.last_item));
  return Promise.all(
    pending.map(async (conversation) => {
      const person = await personFor(conversation.contact_number);
      const fallback = contactName(conversation.contacts, conversation.contact_number);
      const named = [person?.name, person?.last_name].filter(Boolean).join(" ");
      return {
        contactNumber: conversation.contact_number,
        name: named || fallback,
        company: person?.company?.name ?? contactCompany(conversation.contacts),
        reason: callbackReason(conversation.last_item.result),
        when: conversation.last_item.date,
        preview: itemPreview(conversation.last_item),
        deals: conversation.contacts.flatMap((contact) => contact.deals ?? []),
        person,
      };
    }),
  );
}

function emptySnapshot(partial: Partial<DeskSnapshot> & Pick<DeskSnapshot, "mode" | "headline" | "detail" | "error">): DeskSnapshot {
  const line: LineInfo = partial.line ?? {
    number: "",
    name: "",
    country: "",
    capabilities: [],
  };
  return {
    warning: partial.warning ?? null,
    line,
    conversations: partial.conversations ?? [],
    selected: partial.selected ?? null,
    timeline: partial.timeline ?? [],
    notes: partial.notes ?? [],
    query: partial.query ?? "",
    hits: partial.hits ?? [],
    callbacks: partial.callbacks ?? [],
    events: partial.events ?? recentEvents(),
    ...partial,
  };
}

export async function loadDesk(input: { contact?: string; query?: string }): Promise<DeskSnapshot> {
  const query = input.query?.trim() ?? "";
  if (isLiveMode()) return loadLiveDesk(input.contact, query);
  return loadMockDesk(input.contact, query);
}

async function loadMockDesk(contact: string | undefined, query: string): Promise<DeskSnapshot> {
  const conversations = mockConversations();
  const selected = contact && conversations.some((item) => item.contact_number === contact)
    ? contact
    : conversations[0]?.contact_number ?? null;
  const callbacks = await callbacksFrom(conversations, async (phone) => mockFindPerson(phone));

  return {
    mode: "mock",
    headline: "Mock mode",
    detail: `${MOCK_TEAM} fixtures on ${MOCK_LINE.name}. No Allo account is connected.`,
    warning: null,
    error: null,
    line: MOCK_LINE,
    conversations,
    selected,
    timeline: selected ? mockTimeline(selected) : [],
    notes: selected ? mockNotes(selected) : [],
    query,
    hits: query ? mockSearch(query) : [],
    callbacks,
    events: recentEvents(),
  };
}

async function loadLiveDesk(contact: string | undefined, query: string): Promise<DeskSnapshot> {
  try {
    const account = await loadLiveAccount();
    const conversations = await listLiveConversations(account.line.number);
    const selected = contact && conversations.some((item) => item.contact_number === contact)
      ? contact
      : conversations[0]?.contact_number ?? null;

    const [timeline, notes, hits, callbacks] = await Promise.all([
      selected
        ? searchLiveItems({ alloNumber: account.line.number, contactNumber: selected })
        : Promise.resolve([]),
      selected ? listLiveNotes(selected, account.line.number) : Promise.resolve([]),
      query
        ? searchLiveItems({ alloNumber: account.line.number, search: query })
        : Promise.resolve([]),
      callbacksFrom(conversations, (phone) => findLivePerson(phone).catch(() => null)),
    ]);

    const warning =
      account.missingScopes.length > 0
        ? `This key is missing ${account.missingScopes.join(", ")}.`
        : null;

    return {
      mode: "live",
      headline: "Live",
      detail: `${account.teamName}. Key checked with GET /v2/api/me.`,
      warning,
      error: null,
      line: account.line,
      conversations,
      selected,
      timeline,
      notes,
      query,
      hits,
      callbacks,
      events: recentEvents(),
    };
  } catch (error) {
    const message = error instanceof AlloApiError ? error.message : "Could not reach Allo.";
    return emptySnapshot({
      mode: "live",
      headline: "Live",
      detail: "The API key was rejected or Allo could not be reached.",
      error: message,
    });
  }
}
