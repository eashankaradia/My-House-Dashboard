import Link from "next/link";
import { BookOpen, ChevronRight, Heart, Images, Lock, StickyNote } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { lockPrivate } from "./actions";

export const metadata = { title: "Private" };

const DESTINATIONS = [
  { href: "/journal", title: "Journal", description: "Daily reflections & mood", icon: BookOpen },
  { href: "/health", title: "Health", description: "Records, appointments & medication", icon: Heart },
  { href: "/private-notes", title: "Private Notes", description: "Freeform notes only you can see", icon: StickyNote },
  { href: "/private-photos", title: "Private Photos", description: "Photos only you can see", icon: Images },
];

export default function PrivateHubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Private"
        description="Never shared with the household — only visible to you."
        info="Everything here stays locked behind your password. It automatically re-locks after 24 hours, or you can lock it right away below."
      >
        <form action={lockPrivate}>
          <button
            type="submit"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border px-3 text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Lock className="h-4 w-4" /> Lock now
          </button>
        </form>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2">
        {DESTINATIONS.map((d) => (
          <Link
            key={d.href}
            href={d.href}
            className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3.5 transition-all active:scale-[0.99]"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <d.icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="font-medium">{d.title}</p>
              <p className="truncate text-xs text-muted-foreground">{d.description}</p>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}
      </div>
    </div>
  );
}
