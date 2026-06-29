import Link from "next/link";
import { redirect } from "next/navigation";
import { Bell, Home } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { MobileNav } from "@/components/layout/mobile-nav";
import { BottomNav } from "@/components/layout/bottom-nav";
import { FloatingAdd } from "@/components/layout/floating-add";
import { AutoRefresh } from "@/components/layout/auto-refresh";
import { UserMenu } from "@/components/layout/user-menu";
import { GlobalSearch } from "@/components/layout/global-search";
import { cookies } from "next/headers";
import { HouseholdColorsProvider } from "@/components/providers/household-colors";
import { PrefsProvider } from "@/components/providers/prefs";
import { PREFS_COOKIE, parsePrefs } from "@/lib/prefs";
import { getHouseholdColors } from "@/lib/household";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const meta = user.user_metadata ?? {};
  const name = (meta.full_name as string) ?? (meta.name as string) ?? null;
  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("recipient_user_id", user.id)
    .is("read_at", null);

  const memberColors = await getHouseholdColors();
  const initialPrefs = parsePrefs((await cookies()).get(PREFS_COOKIE)?.value);

  return (
    <HouseholdColorsProvider colors={memberColors}>
    <PrefsProvider initial={initialPrefs}>
    <div className="min-h-screen overflow-x-hidden lg:grid lg:grid-cols-[16rem_minmax(0,1fr)]">
      {/* Desktop sidebar */}
      <aside className="hidden border-r bg-card/40 lg:flex lg:flex-col">
        <Link href="/dashboard" className="flex items-center gap-2.5 px-6 py-5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow">
            <Home className="h-5 w-5" />
          </span>
          <span className="text-[15px] font-semibold">My House</span>
        </Link>
        <SidebarNav />
        <div className="px-5 py-4 text-xs text-muted-foreground">
          {new Date().getFullYear()} · Home command centre
        </div>
      </aside>

      <div className="flex min-h-screen min-w-0 flex-col">
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b bg-background/80 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-2">
            <MobileNav />
            <Link href="/dashboard" className="flex items-center gap-2 lg:hidden">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <Home className="h-4 w-4" />
              </span>
              <span className="font-semibold">My House</span>
            </Link>
          </div>
          <div className="flex items-center gap-1 sm:gap-2">
            <GlobalSearch />
            <Link
              href="/notifications"
              className="relative rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
              aria-label={`${unreadCount ?? 0} unread notifications`}
            >
              <Bell className="h-5 w-5" />
              {(unreadCount ?? 0) > 0 ? (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-destructive-foreground">
                  {unreadCount}
                </span>
              ) : null}
            </Link>
            <UserMenu
              name={name}
              email={user.email}
              avatarUrl={(meta.avatar_url as string) ?? null}
            />
          </div>
        </header>

        <main className="min-w-0 flex-1 px-4 py-5 pb-[calc(6rem+env(safe-area-inset-bottom))] sm:px-6 lg:px-8 lg:pb-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
      </div>

      <BottomNav />
      <FloatingAdd />
      <AutoRefresh />
    </div>
    </PrefsProvider>
    </HouseholdColorsProvider>
  );
}
