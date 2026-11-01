import type {
  ConversationItem,
  ConversationNote,
  ConversationSummary,
  CrmPerson,
  LineInfo,
} from "./types";

const BASE_URL = "https://api.withallo.com";

export class AlloApiError extends Error {
  status: number;
  code: string | null;

  constructor(status: number, message: string, code: string | null) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

type MeResponse = {
  data: {
    api_key_id: string;
    scopes: string[];
    team: { id: string; name: string };
  };
};

type NumbersResponse = {
  data: Array<{
    number: string | null;
    name: string;
    country: string;
    type: string;
    capabilities: string[];
  }>;
};

type ListResponse<T> = { data: T[] };

const NEEDED_SCOPES = [
  "CONVERSATIONS_READ",
  "CRM_READ",
  "NOTES_READ",
  "NOTES_WRITE",
  "SMS_SEND",
  "PHONE_NUMBERS_READ",
];

async function allo<T>(path: string, init?: RequestInit): Promise<T> {
  const key = process.env.ALLO_API_KEY;
  if (!key) {
    throw new AlloApiError(401, "ALLO_API_KEY is not set.", "API_KEY_INVALID");
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      Authorization: `Api-Key ${key}`,
      Accept: "application/json",
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
  });

  const body = (await response.json().catch(() => null)) as
    | {
        error?: { message?: string; code?: string };
        code?: string;
        message?: string;
      }
    | null;

  if (!response.ok) {
    const message =
      body?.error?.message ||
      body?.message ||
      body?.error?.code ||
      body?.code ||
      `Allo returned ${response.status}`;
    throw new AlloApiError(response.status, message, body?.error?.code ?? body?.code ?? null);
  }

  return body as T;
}

export async function loadLiveAccount(): Promise<{
  teamName: string;
  keyId: string;
  scopes: string[];
  missingScopes: string[];
  line: LineInfo;
}> {
  const me = await allo<MeResponse>("/v2/api/me");
  const missingScopes = NEEDED_SCOPES.filter((scope) => !me.data.scopes.includes(scope));
  const configured = process.env.ALLO_NUMBER?.trim();

  if (configured) {
    return {
      teamName: me.data.team.name,
      keyId: me.data.api_key_id,
      scopes: me.data.scopes,
      missingScopes,
      line: {
        number: configured,
        name: configured,
        country: "",
        capabilities: ["VOICE", "SMS"],
      },
    };
  }

  const numbers = await allo<NumbersResponse>("/v2/api/numbers");
  const line = numbers.data.find((entry) => entry.type === "NUMBER" && entry.number);
  if (!line?.number) {
    throw new AlloApiError(
      404,
      "GET /v2/api/numbers did not return a phone number.",
      "PHONE_NUMBER_NOT_FOUND",
    );
  }

  return {
    teamName: me.data.team.name,
    keyId: me.data.api_key_id,
    scopes: me.data.scopes,
    missingScopes,
    line: {
      number: line.number,
      name: line.name,
      country: line.country,
      capabilities: line.capabilities,
    },
  };
}

export async function listLiveConversations(alloNumber: string): Promise<ConversationSummary[]> {
  const query = new URLSearchParams({
    allo_number: alloNumber,
    page: "1",
    size: "30",
  });
  const response = await allo<ListResponse<ConversationSummary>>(
    `/v2/api/conversations?${query.toString()}`,
  );
  return response.data;
}

export async function searchLiveItems(input: {
  alloNumber: string;
  contactNumber?: string;
  search?: string;
}): Promise<ConversationItem[]> {
  const response = await allo<ListResponse<ConversationItem>>("/v2/api/conversations/items/search", {
    method: "POST",
    body: JSON.stringify({
      allo_number: input.alloNumber,
      contact_number: input.contactNumber,
      search: input.search,
      sort: input.search ? "RELEVANCE" : "DATE_DESC",
      extend: "transcript",
      page: 1,
      size: 40,
    }),
  });
  const items = response.data;
  if (input.contactNumber && !input.search) {
    return [...items].sort((a, b) => a.date.localeCompare(b.date));
  }
  return items;
}

export async function findLivePerson(phoneNumber: string): Promise<CrmPerson | null> {
  const search = await allo<ListResponse<{ id: string }>>("/v2/api/crm/people/search", {
    method: "POST",
    body: JSON.stringify({
      filters: { phone_number: phoneNumber },
      page: 1,
      size: 1,
    }),
  });
  const id = search.data[0]?.id;
  if (!id) return null;
  const person = await allo<{ data: CrmPerson }>(`/v2/api/crm/people/${encodeURIComponent(id)}`);
  return person.data;
}

export async function listLiveNotes(
  contactNumber: string,
  alloNumber: string,
): Promise<ConversationNote[]> {
  const query = new URLSearchParams({
    allo_number: alloNumber,
    page: "1",
    size: "20",
  });
  const response = await allo<ListResponse<ConversationNote>>(
    `/v2/api/conversations/${encodeURIComponent(contactNumber)}/notes?${query.toString()}`,
  );
  return response.data;
}

export async function createLiveNote(
  contactNumber: string,
  alloNumber: string,
  content: string,
): Promise<void> {
  await allo(`/v2/api/conversations/${encodeURIComponent(contactNumber)}/notes`, {
    method: "POST",
    body: JSON.stringify({ content, allo_number: alloNumber }),
  });
}

export async function sendLiveSms(from: string, to: string, message: string): Promise<void> {
  await allo("/v1/api/sms", {
    method: "POST",
    body: JSON.stringify({ from, to, message }),
  });
}
