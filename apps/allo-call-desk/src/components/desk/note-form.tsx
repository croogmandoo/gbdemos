"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addNote } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NoteForm({ contactNumber }: { contactNumber: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      className="grid gap-3"
      onSubmit={async (event) => {
        event.preventDefault();
        setPending(true);
        setNotice(null);
        setError(null);
        const result = await addNote(contactNumber, content);
        setPending(false);
        if (!result.ok) {
          setError(result.error);
          return;
        }
        setContent("");
        setNotice(result.detail);
        router.refresh();
      }}
    >
      <label htmlFor="callback-note" className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
        Add note
      </label>
      <Textarea
        id="callback-note"
        value={content}
        maxLength={4000}
        rows={3}
        placeholder="Internal note. The contact never sees it."
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">{error ?? notice ?? "Saved on this conversation."}</p>
        <Button type="submit" size="sm" variant="outline" disabled={pending || content.trim().length === 0}>
          {pending ? "Saving" : "Save note"}
        </Button>
      </div>
    </form>
  );
}
