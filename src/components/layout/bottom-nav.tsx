"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, Hammer, ShoppingBag, CalendarDays } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { title: "Home", href: "/dashboard", icon: LayoutDashboard },
  { title: "Bills", href: "/bills", icon: Receipt },
  { title: "Projects", href: "/projects", icon: Hammer },
  { title: "Wishlist", href: "/purchases", icon: ShoppingBag },
  { title: "Calendar", href: "/calendar", icon: CalendarDays },
];

/** Fixed bottom navigation for phones (hidden on lg+). */
export function BottomNav() {
  const pathname = usePathname();
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t bg-background/90 backdrop-blur lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {item.title}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
