import type { ConversationItem, ConversationNote, CrmPerson, LineInfo } from "./types";

export const MOCK_LINE: LineInfo = {
  number: "+14155550100",
  name: "Main line",
  country: "US",
  capabilities: ["VOICE", "SMS", "MMS"],
};

export const MOCK_TEAM = "Northline Heating";

const USER = {
  id: "usr-alex",
  name: "Alex Kim",
  email: "alex@northline.example",
};

export const MOCK_PEOPLE: CrmPerson[] = [
  {
    id: "per-emma",
    name: "Emma",
    last_name: "Johnson",
    job_title: "Facilities lead",
    website: "https://whitlow.example",
    address: "400 Market St, San Francisco",
    numbers: ["+14155551021"],
    emails: ["emma@whitlow.example"],
    company: { id: "com-whitlow", name: "Whitlow Apartments" },
    interactions: 6,
    last_activity_at: "2026-11-01T15:51:00Z",
    created_at: "2026-06-02T15:00:00Z",
    updated_at: "2026-11-01T15:51:00Z",
    custom_attributes: { lead_source: "Referral", budget: 18000 },
  },
  {
    id: "per-mason",
    name: "Mason",
    last_name: "Brooks",
    job_title: "Owner",
    website: "https://ashgrove.example",
    address: "88 Folsom St, San Francisco",
    numbers: ["+14155551022"],
    emails: ["mason@ashgrove.example"],
    company: { id: "com-ashgrove", name: "Ashgrove Plumbing" },
    interactions: 4,
    last_activity_at: "2026-10-31T18:12:00Z",
    created_at: "2026-04-11T17:00:00Z",
    updated_at: "2026-10-31T18:12:00Z",
    custom_attributes: { lead_source: "Repeat customer", budget: 6400 },
  },
  {
    id: "per-liam",
    name: "Liam",
    last_name: "Carter",
    job_title: "Project manager",
    website: null,
    address: "12 Berry St, San Francisco",
    numbers: ["+14155551033"],
    emails: ["liam@cordell.example"],
    company: { id: "com-cordell", name: "Cordell Roofing" },
    interactions: 3,
    last_activity_at: "2026-11-01T14:05:00Z",
    created_at: "2026-08-19T16:00:00Z",
    updated_at: "2026-11-01T14:05:00Z",
    custom_attributes: { lead_source: "Inbound", site: "Friday crew" },
  },
  {
    id: "per-olivia",
    name: "Olivia",
    last_name: "Bennett",
    job_title: "Controller",
    website: "https://verity.example",
    address: "900 Howard St, San Francisco",
    numbers: ["+14155551044"],
    emails: ["olivia@verity.example"],
    company: { id: "com-verity", name: "Verity Interiors" },
    interactions: 5,
    last_activity_at: "2026-11-01T13:20:00Z",
    created_at: "2026-05-08T18:00:00Z",
    updated_at: "2026-11-01T13:20:00Z",
    custom_attributes: { lead_source: "Website", budget: 9200 },
  },
];

function contactFor(personId: string) {
  const person = MOCK_PEOPLE.find((entry) => entry.id === personId);
  if (!person) return [];
  return [
    {
      id: person.id.replace("per-", "cnt-"),
      name: `${person.name} ${person.last_name}`,
      company: person.company,
      deals:
        person.id === "per-emma"
          ? [{ id: "dea-boiler", name: "Boiler replacement", status: "OPEN" }]
          : person.id === "per-liam"
            ? [{ id: "dea-friday", name: "Friday roof slot", status: "OPEN" }]
            : [],
    },
  ];
}

export const MOCK_ITEMS: ConversationItem[] = [
  {
    id: "cll-emma-boiler",
    type: "CALL",
    direction: "INBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551021",
    contacts: contactFor("per-emma"),
    user: USER,
    date: "2026-11-01T15:40:00Z",
    duration: 214,
    result: "ANSWERED",
    summary:
      "Called back about the boiler replacement quote, confirmed the price works, and asked for the earliest site visit.",
    tags: ["quote"],
    transcript: [
      {
        source: "EXTERNAL",
        time: "2026-11-01T15:40:08Z",
        text: "Can you send the boiler quote over today? The price we discussed works if you can start this month.",
      },
      {
        source: "USER",
        time: "2026-11-01T15:40:22Z",
        text: "The boiler quote is already in your inbox. The earliest site visit is Thursday morning.",
      },
    ],
    content: null,
    status: null,
    message_type: null,
  },
  {
    id: "msg-emma-slot",
    type: "SMS",
    direction: "OUTBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551021",
    contacts: contactFor("per-emma"),
    user: USER,
    date: "2026-11-01T15:51:00Z",
    duration: null,
    result: null,
    summary: null,
    tags: null,
    transcript: null,
    content: "Earliest site visit for the boiler is Thursday at 8. I'll hold the slot.",
    status: "DELIVERED",
    message_type: "SMS",
  },
  {
    id: "cll-mason-vm",
    type: "CALL",
    direction: "INBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551022",
    contacts: contactFor("per-mason"),
    user: USER,
    date: "2026-10-31T18:12:00Z",
    duration: 42,
    result: "VOICEMAIL",
    summary:
      "Went through Thursday's install list. He'll confirm the parts order in the morning.",
    tags: ["install"],
    transcript: [
      {
        source: "EXTERNAL",
        time: "2026-10-31T18:12:06Z",
        text: "Mason here. Thursday's install list looks fine. Confirm the parts order in the morning and call me back.",
      },
    ],
    content: null,
    status: null,
    message_type: null,
  },
  {
    id: "msg-liam-friday",
    type: "SMS",
    direction: "INBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551033",
    contacts: contactFor("per-liam"),
    user: USER,
    date: "2026-10-30T16:05:00Z",
    duration: null,
    result: null,
    summary: null,
    tags: null,
    transcript: null,
    content: "Can we move the Friday slot to the morning if anything opens up?",
    status: "DELIVERED",
    message_type: "SMS",
  },
  {
    id: "cll-liam-missed",
    type: "CALL",
    direction: "INBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551033",
    contacts: contactFor("per-liam"),
    user: USER,
    date: "2026-11-01T14:05:00Z",
    duration: 18,
    result: "RECEIVED",
    summary: null,
    tags: null,
    transcript: null,
    content: null,
    status: null,
    message_type: null,
  },
  {
    id: "cll-olivia-quote",
    type: "CALL",
    direction: "OUTBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551044",
    contacts: contactFor("per-olivia"),
    user: USER,
    date: "2026-10-29T19:10:00Z",
    duration: 306,
    result: "ANSWERED",
    summary: "Walked the lobby refresh quote. She will check it with the building owner.",
    tags: ["quote"],
    transcript: [
      {
        source: "USER",
        time: "2026-10-29T19:10:12Z",
        text: "The lobby quote covers the two fan coils and the new thermostat.",
      },
      {
        source: "EXTERNAL",
        time: "2026-10-29T19:11:02Z",
        text: "I'll take the quote to the owner this week.",
      },
    ],
    content: null,
    status: null,
    message_type: null,
  },
  {
    id: "msg-olivia-invoices",
    type: "SMS",
    direction: "INBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551044",
    contacts: contactFor("per-olivia"),
    user: USER,
    date: "2026-11-01T13:20:00Z",
    duration: null,
    result: null,
    summary: null,
    tags: null,
    transcript: null,
    content: "Can you split the quote across two invoices?",
    status: "DELIVERED",
    message_type: "SMS",
  },
  {
    id: "cll-unknown-hangup",
    type: "CALL",
    direction: "INBOUND",
    allo_number: MOCK_LINE.number,
    contact_number: "+14155551189",
    contacts: [],
    user: USER,
    date: "2026-11-01T12:02:00Z",
    duration: 8,
    result: "CLOSED",
    summary: null,
    tags: null,
    transcript: null,
    content: null,
    status: null,
    message_type: null,
  },
];

export const MOCK_NOTES: ConversationNote[] = [
  {
    id: "not-mason-1",
    content: "Call Mason before 9. He is on a job site after that.",
    contact_number: "+14155551022",
    allo_number: MOCK_LINE.number,
    user: { id: "usr-alex", name: "Alex Kim" },
    created_at: "2026-10-31T18:40:00Z",
    updated_at: "2026-10-31T18:40:00Z",
  },
];

export type ScriptedDelivery = {
  id: string;
  topic: "call.received" | "sms.received" | "call.completed";
  timestamp: string;
  data: Record<string, unknown>;
};

export const SCRIPTED_EVENTS: ScriptedDelivery[] = [
  {
    id: "msg_mock_priya_ring",
    topic: "call.received",
    timestamp: "2026-11-01T18:05:00.000Z",
    data: {
      from_number: "+14155551640",
      to_number: MOCK_LINE.number,
      started_at: "2026-11-01T18:05:00.000Z",
      user_email: USER.email,
      person: {
        id: "per-priya",
        name: "Priya",
        last_name: "Shah",
        email: "priya@harbor.example",
        emails: ["priya@harbor.example"],
        numbers: ["+14155551640"],
        job_title: "Building manager",
      },
      company: { id: "com-harbor", name: "Harbor Court" },
      deals: null,
    },
  },
  {
    id: "msg_mock_emma_sms",
    topic: "sms.received",
    timestamp: "2026-11-01T18:06:00.000Z",
    data: {
      id: "msg-emma-model",
      direction: "INBOUND",
      type: "SMS",
      content: "Thursday at 8 works. Please text the boiler model number.",
      sent_at: "2026-11-01T18:06:00.000Z",
      from_number: "+14155551021",
      to_number: MOCK_LINE.number,
      from_name: "Emma Johnson",
      to_name: "Northline Heating",
      user_email: USER.email,
    },
  },
  {
    id: "msg_mock_priya_done",
    topic: "call.completed",
    timestamp: "2026-11-01T18:08:00.000Z",
    data: {
      id: "cll-priya-thermostat",
      start_date: "2026-11-01T18:05:00.000Z",
      from_number: "+14155551640",
      from_name: "Priya Shah",
      to: MOCK_LINE.number,
      to_name: "Northline Heating",
      length_in_minutes: 3.5,
      length: "3m 30s",
      summary:
        "The thermostat in the boiler room will not hold temperature. She wants a tech tomorrow morning.",
      transcriptions: [
        {
          source: "EXTERNAL",
          time: "2026-11-01T18:05:12.000Z",
          text: "The thermostat in the boiler room will not hold a temperature.",
        },
        {
          source: "USER",
          time: "2026-11-01T18:05:28.000Z",
          text: "I can put a tech on it tomorrow morning.",
        },
      ],
      concatenated_transcript:
        "The thermostat in the boiler room will not hold a temperature.\nI can put a tech on it tomorrow morning.",
      type: "INBOUND",
      result: "ANSWERED",
      user_email: USER.email,
    },
  },
  {
    id: "msg_mock_mason_ring",
    topic: "call.received",
    timestamp: "2026-11-01T18:10:00.000Z",
    data: {
      from_number: "+14155551022",
      to_number: MOCK_LINE.number,
      started_at: "2026-11-01T18:10:00.000Z",
      user_email: USER.email,
      person: {
        id: "per-mason",
        name: "Mason",
        last_name: "Brooks",
        numbers: ["+14155551022"],
        job_title: "Owner",
      },
      company: { id: "com-ashgrove", name: "Ashgrove Plumbing" },
      deals: null,
    },
  },
];
