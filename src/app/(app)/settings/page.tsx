import { Eye, History, LayoutGrid, LogOut, Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeToggle } from "@/components/theme-toggle";
import { formatDate, initialsFromName } from "@/lib/utils";
import { getHouseholdMap } from "@/lib/household";
import type { ActivityLog, HouseholdMember } from "@/lib/database.types";
import { DisplayNameForm } from "./display-name-form";
import { TabVisibilitySettings } from "./tab-visibility";

export const metadata = { title: "Settings" };

const ENTITY_LABEL: Record<string, string> = {
  bills: "bill",
  mortgages: "mortgage",
  savings_pots: "savings pot",
  collections: "collection",
  inspiration: "idea",
  projects: "project",
  purchases: "purchase",
  maintenance_tasks: "maintenance task",
  documents: "document",
};
const ACTION_VERB: Record<string, string> = { insert: "added", update: "updated", delete: "removed" };

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: memberData }, { data: activityData }, memberMap] = await Promise.all([
    supabase.from("household_members").select("*").order("display_name"),
    supabase.from("activity_log").select("*").order("created_at", { ascending: false }).limit(40),
    getHouseholdMap(),
  ]);

  const members = (memberData ?? []) as HouseholdMember[];
  const activity = (activityData ?? []) as ActivityLog[];
  const myName = (user && memberMap[user.id]) || "";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Personalise your dashboard and manage your household."
        info="Change your display name, choose which tabs appear in the sidebar, see who's in your household, and review the change log of everything that's been added or edited."
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

      {/* Change log */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <History className="h-4 w-4" /> Change log
          </CardTitle>
          <CardDescription>Recent additions and edits across your home.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-1.5">
          {activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity yet. Once the change-log migration is run, edits will appear here.
            </p>
          ) : (
            activity.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 border-b py-2 text-sm last:border-0">
                <span className="min-w-0">
                  <span className="font-medium">{(a.user_id && memberMap[a.user_id]) || "Someone"}</span>{" "}
                  {ACTION_VERB[a.action] ?? a.action} {ENTITY_LABEL[a.entity_type] ?? a.entity_type}
                  {a.entity_label ? (
                    <span className="text-muted-foreground"> “{a.entity_label}”</span>
                  ) : null}
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">{formatDate(a.created_at)}</span>
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
