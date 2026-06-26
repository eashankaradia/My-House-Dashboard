import { Bell, Download, Eye, Gauge, LayoutGrid, LogOut, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { initialsFromName } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type { Bill, HouseholdMember, MaintenanceTask, NotificationPreference, Project, Purchase } from "@/lib/database.types";
import { DisplayNameForm } from "./display-name-form";
import { TabVisibilitySettings } from "./tab-visibility";
import { NotificationPreferences } from "./notification-preferences";
import { ExportSettings } from "./export-settings";
import { GlanceStatsSettings } from "@/app/(app)/dashboard/glance-stats";
import { BottomTabsSettings } from "./bottom-tabs";

export const metadata = { title: "Settings" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: memberData },
    { data: preferenceData },
    { data: billData },
    { data: purchaseData },
    { data: projectData },
    { data: maintenanceData },
    memberMap,
  ] = await Promise.all([
    supabase.from("household_members").select("*").order("display_name"),
    supabase.from("notification_preferences").select("*"),
    supabase.from("bills").select("*").order("name"),
    supabase.from("purchases").select("*").order("created_at", { ascending: false }),
    supabase.from("projects").select("*").order("created_at", { ascending: false }),
    supabase.from("maintenance_tasks").select("*").order("next_due_date"),
    getHouseholdMap(),
  ]);

  const members = (memberData ?? []) as HouseholdMember[];
  const myName = (user && memberMap[user.id]) || "";
  const preferences = (preferenceData ?? []) as NotificationPreference[];
  const bills = (billData ?? []) as Bill[];
  const purchases = (purchaseData ?? []) as Purchase[];
  const projects = (projectData ?? []) as Project[];
  const maintenance = (maintenanceData ?? []) as MaintenanceTask[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Personalise your dashboard and manage your household."
        info="Change your display name, choose which tabs appear in the sidebar, and see who's in your household. The full change log lives in its own tab."
      />

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
          <CardDescription>This is the name shown on items you add.</CardDescription>
        </CardHeader>
        <CardContent>
          <DisplayNameForm initial={myName} />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Appearance</CardTitle>
          <CardDescription>Switch between light and dark mode.</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center gap-3">
          <ThemeToggle />
          <span className="text-sm text-muted-foreground">Toggle theme</span>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-4 w-4" /> Sidebar tabs
          </CardTitle>
          <CardDescription>
            Hide sections you don&apos;t use (saved on this device). Dashboard and Settings always stay.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <TabVisibilitySettings />
        </CardContent>
      </Card>

      {/* Bottom bar tabs (mobile) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <LayoutGrid className="h-4 w-4" /> Bottom bar tabs
          </CardTitle>
          <CardDescription>
            Choose which tabs (up to 4) appear in the phone bottom bar, around the + button, and their order.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <BottomTabsSettings />
        </CardContent>
      </Card>

      {/* Glance stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-4 w-4" /> Dashboard glance stats
          </CardTitle>
          <CardDescription>
            Pick which headline stats appear at the top of your dashboard, and their order (saved on this device).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <GlanceStatsSettings />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Bell className="h-4 w-4" /> Notification preferences
          </CardTitle>
          <CardDescription>Choose which household updates appear in your notification inbox.</CardDescription>
        </CardHeader>
        <CardContent>
          <NotificationPreferences preferences={preferences} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Download className="h-4 w-4" /> Export data
          </CardTitle>
          <CardDescription>Choose a section and download its current data as CSV.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExportSettings
            sets={{
              bills: { label: "Bills & expenses", filename: "bills", rows: bills, columns: ["name", "category", "amount", "frequency", "due_date", "end_date", "account_id", "is_fixed", "notes"] },
              purchases: { label: "Future purchases", filename: "purchases", rows: purchases, columns: ["name", "category", "room", "priority", "status", "price", "rating", "non_negotiables", "notes"] },
              projects: { label: "Projects", filename: "projects", rows: projects, columns: ["name", "category", "status", "priority", "estimated_cost", "actual_cost", "target_completion_date", "notes"] },
              maintenance: { label: "Maintenance", filename: "maintenance", rows: maintenance, columns: ["task", "frequency", "last_completed_date", "next_due_date", "cost", "notes"] },
            }}
          />
        </CardContent>
      </Card>

      {/* Household */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Users className="h-4 w-4" /> Household
          </CardTitle>
          <CardDescription>Everyone here shares the same home data.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No household members yet. Run the household migration in Supabase to enable sharing.
            </p>
          ) : (
            members.map((m) => (
              <div key={m.user_id} className="flex items-center gap-3 rounded-lg border p-2.5">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{initialsFromName(m.display_name)}</AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">{m.display_name}</span>
                {user?.id === m.user_id ? (
                  <span className="ml-auto text-xs text-muted-foreground">You</span>
                ) : null}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Eye className="h-4 w-4" /> Account
          </CardTitle>
          <CardDescription>{user?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <form action="/auth/signout" method="post">
            <Button type="submit" variant="outline" className="gap-2">
              <LogOut className="h-4 w-4" /> Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
