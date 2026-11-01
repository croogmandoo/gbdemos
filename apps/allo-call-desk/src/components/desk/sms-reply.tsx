"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendSms } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { formatPhone } from "@/lib/allo/format";

export function SmsReply({
  to,
  from,
  canSend,
}: {
  to: string;
  from: string;
  canSend: boolean;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function confirmSend() {
    setPending(true);
    setError(null);
    const result = await sendSms({ to, message, confirmed: true });
    setPending(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage("");
    setOpen(false);
    setNotice(result.detail);
    router.refresh();
  }

  return (
    <form
      className="grid gap-3 border-t border-border px-5 py-5"
      onSubmit={(event) => {
        event.preventDefault();
        setNotice(null);
        setError(null);
        if (!message.trim()) return;
        setOpen(true);
      }}
    >
      <label htmlFor="sms-reply" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Reply by text
      </label>
      <Textarea
        id="sms-reply"
        value={message}
        maxLength={1000}
        rows={3}
        placeholder={canSend ? "Write a reply. Nothing sends until you confirm." : "This line cannot send SMS."}
        disabled={!canSend}
        onChange={(event) => setMessage(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {notice ?? "From " + formatPhone(from)}
        </p>
        <Button type="submit" size="sm" disabled={!canSend || message.trim().length === 0}>
          Review reply
        </Button>
      </div>
      {error && !open ? <p className="text-sm text-destructive">{error}</p> : null}

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Send this text?</AlertDialogTitle>
            <AlertDialogDescription>
              {formatPhone(from)} to {formatPhone(to)}. Nothing has been sent yet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <p className="text-sm whitespace-pre-wrap">{message}</p>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={pending}>Back</AlertDialogCancel>
            <AlertDialogAction type="button" disabled={pending} onClick={() => void confirmSend()}>
              {pending ? "Sending" : "Send text"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </form>
  );
}
