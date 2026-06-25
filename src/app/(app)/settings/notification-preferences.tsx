"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { NOTIFICATION_ENTITY_TYPES } from "@/lib/constants";
import type { NotificationPreference } from "@/lib/database.types";
import { setNotificationPreference } from "@/app/(app)/notifications/actions";

export function NotificationPreferences({ preferences }: { preferences: NotificationPreference[] }) {
  const initial = new Map(preferences.map((preference) => [preference.entity_type, preference.enabled]));
  const [values, setValues] = React.useState<Record<string, boolean>>(
    Object.fromEntries(NOTIFICATION_ENTITY_TYPES.map(([type]) => [type, initial.get(type) ?? true])),
  );
  const { toast } = useToast();

  function change(type: string, enabled: boolean) {
    setValues((current) => ({ ...current, [type]: enabled }));
    React.startTransition(async () => {
      const result = await setNotificationPreference(type, enabled);
      if (result.error) toast({ variant: "destructive", title: "Couldn't save preference", description: result.error });
    });
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {NOTIFICATION_ENTITY_TYPES.map(([type, label]) => (
        <label key={type} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <span>Updates to {label.toLowerCase()}</span>
          <input
            type="checkbox"
            checked={values[type]}
            onChange={(event) => change(type, event.target.checked)}
            className="h-4 w-4 accent-primary"
          />
        </label>
      ))}
    </div>
  );
}
