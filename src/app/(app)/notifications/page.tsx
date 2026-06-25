import { Bell } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { getHouseholdMap } from "@/lib/household";
import type { Notification } from "@/lib/database.types";
import { NotificationControls } from "./notification-controls";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const [{ data }, memberMap] = await Promise.all([
    supabase.from("notifications").select("*").order("created_at", { ascending: false }).limit(100),
    getHouseholdMap(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="Updates that need your attention."
        info="Automatic updates follow your preferences. You can also push a specific note to another household member."
      >
        <Bell className="h-5 w-5 text-muted-foreground" />
      </PageHeader>
      <NotificationControls
        notifications={(data ?? []) as Notification[]}
        memberMap={memberMap}
        currentUserId={user!.id}
      />
    </div>
  );
}
