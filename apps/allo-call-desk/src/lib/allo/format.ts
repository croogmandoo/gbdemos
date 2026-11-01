import type { CallResult, ContactRef, ConversationItem } from "./types";

const CALLBACK_RESULTS = new Set<CallResult>(["RECEIVED", "CLOSED", "VOICEMAIL"]);

export function formatPhone(value: string): string {
  const match = value.match(/^\+1(\d{3})(\d{3})(\d{4})$/);
  if (match) return `+1 ${match[1]} ${match[2]} ${match[3]}`;
  return value;
}

export function formatWhen(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  const now = new Date();
  const sameDay = date.toISOString().slice(0, 10) === now.toISOString().slice(0, 10);
  if (sameDay) {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(date);
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export function formatDuration(seconds: number | null): string | null {
  if (seconds == null) return null;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  if (minutes === 0) return `${rest}s`;
  return `${minutes}m ${rest.toString().padStart(2, "0")}s`;
}

export function contactName(contacts: ContactRef[] | undefined, number: string): string {
  const named = contacts?.find((contact) => contact.name);
  return named?.name ?? formatPhone(number);
}

export function contactCompany(contacts: ContactRef[] | undefined): string | null {
  return contacts?.find((contact) => contact.company?.name)?.company?.name ?? null;
}

export function itemPreview(item: {
  type: "CALL" | "SMS";
  summary: string | null;
  content: string | null;
  result: CallResult | null;
}): string {
  if (item.summary) return item.summary;
  if (item.content) return item.content;
  return resultLabel(item.result) ?? (item.type === "CALL" ? "Call" : "Message");
}

export function resultLabel(result: CallResult | null): string | null {
  switch (result) {
    case "ANSWERED":
      return "Answered";
    case "VOICEMAIL":
      return "Voicemail";
    case "RECEIVED":
      return "Missed call";
    case "CLOSED":
      return "Caller hung up";
    case "TRANSFERRED_AI":
      return "AI receptionist";
    case "TRANSFERRED_EXTERNAL":
      return "Transferred";
    case "BLOCKED":
      return "Blocked";
    case "FAILED":
    case "FAILED_EXTERNAL":
      return "Failed";
    default:
      return result;
  }
}

export function isCallbackItem(item: {
  type: "CALL" | "SMS";
  direction: "INBOUND" | "OUTBOUND";
  result: CallResult | null;
}): boolean {
  return (
    item.type === "CALL" &&
    item.direction === "INBOUND" &&
    item.result != null &&
    CALLBACK_RESULTS.has(item.result)
  );
}

export function callbackReason(result: CallResult | null): string {
  if (result === "VOICEMAIL") return "Voicemail";
  if (result === "CLOSED") return "Caller hung up";
  return "Missed call";
}

export function personName(person: {
  name: string | null;
  last_name: string | null;
}): string {
  return [person.name, person.last_name].filter(Boolean).join(" ") || "Unnamed contact";
}

export function searchableText(item: ConversationItem): string {
  const transcript = item.transcript?.map((entry) => entry.text).join(" ") ?? "";
  return [item.summary, item.content, transcript].filter(Boolean).join(" ");
}
