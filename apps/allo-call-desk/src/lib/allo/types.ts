export type CallResult =
  | "ANSWERED"
  | "VOICEMAIL"
  | "TRANSFERRED_AI"
  | "TRANSFERRED_EXTERNAL"
  | "BLOCKED"
  | "FAILED"
  | "FAILED_EXTERNAL"
  | "RECEIVED"
  | "CLOSED";

export type Direction = "INBOUND" | "OUTBOUND";

export type DealRef = {
  id: string;
  name: string;
  status: string;
};

export type ContactRef = {
  id: string;
  name: string;
  company?: { id: string; name: string } | null;
  deals?: DealRef[];
};

export type TranscriptEntry = {
  source: "USER" | "EXTERNAL";
  time: string;
  text: string;
};

export type ConversationItem = {
  id: string;
  type: "CALL" | "SMS";
  direction: Direction;
  allo_number: string;
  contact_number: string;
  contacts: ContactRef[];
  user: { id: string; name: string; email?: string } | null;
  date: string;
  duration: number | null;
  result: CallResult | null;
  summary: string | null;
  tags: string[] | null;
  transcript: TranscriptEntry[] | null;
  content: string | null;
  status: "PENDING" | "SENT" | "DELIVERED" | "FAILED" | null;
  message_type: "SMS" | "MMS" | "WHATSAPP" | null;
};

export type ConversationSummary = {
  contact_number: string;
  contacts: ContactRef[];
  last_activity: string;
  last_item: {
    id: string;
    type: "CALL" | "SMS";
    direction: Direction;
    date: string;
    summary: string | null;
    content: string | null;
    result: CallResult | null;
    duration: number | null;
  };
  pinned: boolean;
  allo_number: string;
};

export type CrmPerson = {
  id: string;
  name: string | null;
  last_name: string | null;
  job_title: string | null;
  website: string | null;
  address: string | null;
  numbers: string[];
  emails: string[];
  company: { id: string; name: string } | null;
  interactions: number;
  last_activity_at: string | null;
  created_at: string;
  updated_at: string;
  custom_attributes: Record<string, string | number>;
};

export type ConversationNote = {
  id: string;
  content: string;
  contact_number: string;
  allo_number: string;
  user: { id: string; name: string };
  created_at: string;
  updated_at: string;
};

export type FeedTopic = "call.received" | "sms.received" | "call.completed";

export type FeedEvent = {
  id: string;
  topic: FeedTopic;
  version: "2.0";
  timestamp: string;
  receivedAt: string;
  data: Record<string, unknown>;
};

export type LineInfo = {
  number: string;
  name: string;
  country: string;
  capabilities: string[];
};

export type CallbackRow = {
  contactNumber: string;
  name: string;
  company: string | null;
  reason: string;
  when: string;
  preview: string | null;
  deals: DealRef[];
  person: CrmPerson | null;
};

export type DeskSnapshot = {
  mode: "mock" | "live";
  headline: string;
  detail: string;
  warning: string | null;
  error: string | null;
  line: LineInfo;
  conversations: ConversationSummary[];
  selected: string | null;
  timeline: ConversationItem[];
  notes: ConversationNote[];
  query: string;
  hits: ConversationItem[];
  callbacks: CallbackRow[];
  events: FeedEvent[];
};

export type ActionResult =
  | { ok: true; detail: string }
  | { ok: false; error: string };
