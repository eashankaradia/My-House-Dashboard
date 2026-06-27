"use client";

import * as React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import type { MemberMap } from "@/lib/household";
import type { Notification } from "@/lib/database.types";
import { formatDate } from "@/lib/utils";
import { markAllNotificationsRead, markNotificationRead } from "./actions";

export function NotificationControls({
  notifications,
  memberMap,
}: {
  notifications: Notification[];
  memberMap: MemberMap;
}) {
  const [pending, startTransition] = React.useTransition();

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Your notifications</h2>
        <Button variant="outline" size="sm" disabled={pending} onClick={() => startTransition(async () => { await markAllNotificationsRead(); })}>
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
  );
}
