"use server";

import { revalidatePath } from "next/cache";
import { connection } from "next/server";
import { isLiveMode } from "@/lib/allo/desk";
import { createLiveNote, loadLiveAccount, sendLiveSms } from "@/lib/allo/live";
import { mockAddNote, mockSendSms, pushScriptedEvent } from "@/lib/allo/mock-store";
import type { ActionResult } from "@/lib/allo/types";

const E164 = /^\+[1-9]\d{7,14}$/;

function clean(value: string, max: number): string | null {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > max) return null;
  return trimmed;
}

function failure(error: unknown, fallback: string): ActionResult {
  return { ok: false, error: error instanceof Error ? error.message : fallback };
}

export async function addNote(contactNumber: string, content: string): Promise<ActionResult> {
  await connection();
  const note = clean(content, 4000);
  if (!E164.test(contactNumber) || !note) {
    return { ok: false, error: "Write a note of 1 to 4,000 characters." };
  }

  try {
    if (isLiveMode()) {
      const account = await loadLiveAccount();
      await createLiveNote(contactNumber, account.line.number, note);
    } else {
      mockAddNote(contactNumber, note);
    }
    revalidatePath("/");
    return { ok: true, detail: "Note saved on the conversation." };
  } catch (error) {
    return failure(error, "Could not save the note.");
  }
}

export async function sendSms(input: {
  to: string;
  message: string;
  confirmed: boolean;
}): Promise<ActionResult> {
  await connection();
  if (input.confirmed !== true) {
    return { ok: false, error: "Confirm the message before it is sent." };
  }

  const message = clean(input.message, 1000);
  if (!E164.test(input.to) || !message) {
    return { ok: false, error: "Enter a message of 1 to 1,000 characters." };
  }

  try {
    if (isLiveMode()) {
      const account = await loadLiveAccount();
      if (!account.line.capabilities.includes("SMS")) {
        return { ok: false, error: "This Allo line cannot send SMS." };
      }
      await sendLiveSms(account.line.number, input.to, message);
    } else {
      mockSendSms(input.to, message);
    }
    revalidatePath("/");
    return { ok: true, detail: "Text sent." };
  } catch (error) {
    return failure(error, "Could not send the text.");
  }
}

export async function pushSampleEvent(): Promise<ActionResult> {
  await connection();
  if (isLiveMode()) {
    return { ok: false, error: "Sample events run only in mock mode." };
  }
  const pushed = pushScriptedEvent();
  if (!pushed) return { ok: false, error: "No sample event is queued." };
  revalidatePath("/");
  return { ok: true, detail: pushed.topic };
}
