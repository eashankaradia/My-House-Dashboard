"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import type { MemberMap } from "@/lib/household";
import type { Notification } from "@/lib/database.types";
import { formatDate } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead, sendNotification } from "./actions";

export function NotificationControls({
  notifications,
  memberMap,
  currentUserId,
}: {
  notifications: Notification[];
  memberMap: MemberMap;
  currentUserId: string;
}) {
  const [recipient, setRecipient] = React.useState("");
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [href, setHref] = React.useState("");
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();
  const recipients = Object.entries(memberMap).filter(([id]) => id !== currentUserId);

  function send(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      const result = await sendNotification(recipient, title, message, href);
      if (result.error) {
        toast({ variant: "destructive", title: "Couldn't send notification", description: result.error });
        return;
      }
      toast({ title: "Notification sent" });
      setTitle("");
      setMessage("");
      setHref("");
    });
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(18rem,1fr)]">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">Your notifications</h2>
          <Button variant="outline" size="sm" onClick={() => startTransition(async () => { await markAllNotificationsRead(); })}>
            Mark all read
          </Button>
        </div>
        {notifications.length === 0 ? (
          <p className="rounded-lg border p-6 text-center text-sm text-muted-foreground">Nothing needs your attention.</p>
        ) : (
          <div className="divide-y rounded-lg border">
            {notifications.map((notification) => {
              const content = (
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{notification.title}</p>
                  {notification.message ? <p className="text-sm text-muted-foreground">{notification.message}</p> : null}
                  <p className="text-xs text-muted-foreground">
                    {notification.sender_user_id ? `From ${memberMap[notification.sender_user_id] ?? "household member"} · ` : ""}
                    {formatDate(notification.created_at)}
                  </p>
                </div>
              );
              return (
                <div key={notification.id} className={`flex items-center gap-3 p-3 ${notification.read_at ? "" : "bg-primary/5"}`}>
                  {notification.href ? <Link href={notification.href} className="min-w-0 flex-1 hover:underline">{content}</Link> : content}
                  {!notification.read_at ? (
                    <Button variant="ghost" size="sm" onClick={() => startTransition(async () => { await markNotificationRead(notification.id); })}>
                      Mark read
                    </Button>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </section>

      <form onSubmit={send} className="space-y-3 rounded-lg border p-4">
        <h2 className="font-semibold">Push to someone</h2>
        <Field label="Household member">
          <NativeSelect value={recipient} onChange={(event) => setRecipient(event.target.value)}>
            <option value="">Choose someone</option>
            {recipients.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
          </NativeSelect>
        </Field>
        <Field label="Title"><Input value={title} onChange={(event) => setTitle(event.target.value)} /></Field>
        <Field label="Message"><Textarea rows={3} value={message} onChange={(event) => setMessage(event.target.value)} /></Field>
        <Field label="App link" hint="Optional, e.g. /projects"><Input value={href} onChange={(event) => setHref(event.target.value)} /></Field>
        <Button type="submit" disabled={pending || !recipient || !title.trim()} className="w-full">
          {pending ? "Sending…" : "Send notification"}
        </Button>
      </form>
    </div>
  );
}
