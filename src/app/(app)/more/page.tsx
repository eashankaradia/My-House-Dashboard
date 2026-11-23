import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { MORE_GROUPS, MORE_ITEMS } from "@/lib/constants";

export const metadata = { title: "Everything else" };

/**
 * Index of the pages that aren't in the sidebar. The sidebar only carries
 * what's in regular use; everything built stays reachable here with its data
 * intact.
 */
export default function MorePage() {
  const groups = MORE_GROUPS.map((group) => ({
    group,
    items: MORE_ITEMS.filter((i) => i.group === group),
  })).filter((g) => g.items.length > 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Everything else"
        description="Pages that aren't in the sidebar."
        info="The sidebar carries the things you use regularly. Everything else the app can do lives here, with all its data intact — nothing has been deleted. If you start using one of these regularly, say so and it can move into the sidebar."
      />

      {groups.map(({ group, items }) => (
        <section key={group} className="space-y-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            {group === "Money" ? "Money detail" : "Not used yet"}
          </h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3 text-sm transition-colors hover:bg-accent/40"
              >
                <item.icon className="h-5 w-5 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium">{item.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{item.description}</span>
                </span>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
