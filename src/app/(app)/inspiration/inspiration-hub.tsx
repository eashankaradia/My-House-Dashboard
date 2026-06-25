"use client";

import * as React from "react";
import {
  ExternalLink,
  Hammer,
  LayoutGrid,
  List,
  MoreVertical,
  Newspaper,
  Pencil,
  Rows3,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { CardTrigger } from "@/components/shared/card-trigger";
import { useToast } from "@/hooks/use-toast";
import { cn, formatDate } from "@/lib/utils";
import { priorityVariant } from "@/lib/ui";
import type { Collection, Inspiration } from "@/lib/database.types";
import { InspirationForm } from "./inspiration-form";
import { InspirationDetailDialog } from "./inspiration-detail";
import { convertInspiration, deleteInspiration } from "./actions";
import { SocialEmbed } from "./social-embed";

type View = "feed" | "masonry" | "cards" | "list";

export function InspirationHub({
  items,
  collections,
}: {
  items: Inspiration[];
  collections: Collection[];
}) {
  const [view, setView] = React.useState<View>("feed");
  const [query, setQuery] = React.useState("");
  const [room, setRoom] = React.useState("All");
  const [collection, setCollection] = React.useState("All");

  const rooms = Array.from(new Set(items.map((i) => i.room).filter(Boolean))) as string[];

  const filtered = items.filter((i) => {
    if (room !== "All" && i.room !== room) return false;
    if (collection !== "All" && i.collection_id !== collection) return false;
    if (query) {
      const q = query.toLowerCase();
      const hay = [i.title, i.notes, i.category, i.source, ...(i.tags ?? [])]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Input
          placeholder="Search ideas, tags, notes…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="h-9 w-full sm:w-64"
        />
        <select
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="All">All rooms</option>
          {rooms.map((r) => (
            <option key={r} value={r}>{r}</option>
          ))}
        </select>
        <select
          value={collection}
          onChange={(e) => setCollection(e.target.value)}
          className="h-9 rounded-lg border border-input bg-background px-3 text-sm"
        >
          <option value="All">All collections</option>
          {collections.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <div className="ml-auto flex items-center rounded-lg border p-0.5">
          <ViewButton active={view === "feed"} onClick={() => setView("feed")} icon={Newspaper} label="Feed" />
          <ViewButton active={view === "masonry"} onClick={() => setView("masonry")} icon={LayoutGrid} label="Masonry" />
          <ViewButton active={view === "cards"} onClick={() => setView("cards")} icon={Rows3} label="Cards" />
          <ViewButton active={view === "list"} onClick={() => setView("list")} icon={List} label="List" />
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="py-12 text-center text-sm text-muted-foreground">No ideas match your filters.</p>
      ) : view === "feed" ? (
        <div className="mx-auto max-w-2xl space-y-5">
          {filtered.map((item) => (
            <InspirationFeedItem key={item.id} item={item} collections={collections} />
          ))}
        </div>
      ) : view === "masonry" ? (
        <div className="masonry">
          {filtered.map((item) => (
            <InspirationCard key={item.id} item={item} collections={collections} masonry />
          ))}
        </div>
      ) : view === "cards" ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <InspirationCard key={item.id} item={item} collections={collections} />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((item) => (
            <InspirationRow key={item.id} item={item} collections={collections} />
          ))}
        </div>
      )}
    </div>
  );
}

function InspirationFeedItem({ item, collections }: { item: Inspiration; collections: Collection[] }) {
  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-3 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
            {item.source.slice(0, 2).toUpperCase()}
          </div>
          <InspirationDetailDialog item={item} collections={collections}>
            <CardTrigger className="min-w-0 flex-1 rounded-md">
              <span className="block font-semibold hover:underline">{item.title}</span>
              <span className="text-xs text-muted-foreground">
                {item.source} · updated {formatDate(item.updated_at)}
              </span>
            </CardTrigger>
          </InspirationDetailDialog>
          <ActionsMenu item={item} collections={collections} />
        </div>
        {item.notes ? <p className="whitespace-pre-wrap text-sm">{item.notes}</p> : null}
        {item.link ? (
          <SocialEmbed link={item.link} title={item.title} />
        ) : item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt={item.title} className="max-h-[680px] w-full rounded-lg object-cover" />
        ) : null}
        <div className="flex flex-wrap gap-1.5">
          {item.category ? <Badge variant="outline">{item.category}</Badge> : null}
          {item.room ? <Badge variant="outline">{item.room}</Badge> : null}
          {item.tags?.map((tag) => <Badge key={tag} variant="secondary">#{tag}</Badge>)}
        </div>
      </CardContent>
    </Card>
  );
}

function ViewButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof LayoutGrid;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors",
        active && "bg-accent text-foreground",
      )}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function useConvert(item: Inspiration) {
  const [pending, startTransition] = React.useTransition();
  const { toast } = useToast();

  function convert(target: "project" | "purchase") {
    startTransition(async () => {
      const res = await convertInspiration(item.id, target);
      if (res?.error) {
        toast({ variant: "destructive", title: "Couldn't convert", description: res.error });
        return;
      }
      toast({
        title: target === "project" ? "Added to Projects" : "Added to Purchases",
        description: `"${item.title}" was converted and marked Planned.`,
      });
    });
  }

  function remove() {
    startTransition(async () => {
      const res = await deleteInspiration(item.id);
      if (res?.error) toast({ variant: "destructive", title: "Couldn't delete", description: res.error });
    });
  }

  return { pending, convert, remove };
}

function ActionsMenu({ item, collections }: { item: Inspiration; collections: Collection[] }) {
  const { convert, remove } = useConvert(item);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-foreground">
          <MoreVertical className="h-4 w-4" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <InspirationForm
          inspiration={item}
          collections={collections}
          trigger={
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <Pencil className="h-4 w-4" /> Edit
            </DropdownMenuItem>
          }
        />
        <DropdownMenuItem onSelect={() => convert("project")}>
          <Hammer className="h-4 w-4" /> Convert to project
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => convert("purchase")}>
          <ShoppingBag className="h-4 w-4" /> Convert to purchase
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-destructive focus:text-destructive" onSelect={() => remove()}>
          <Trash2 className="h-4 w-4" /> Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function InspirationCard({
  item,
  collections,
  masonry = false,
}: {
  item: Inspiration;
  collections: Collection[];
  masonry?: boolean;
}) {
  return (
    <Card className={cn("overflow-hidden", masonry && "inline-block w-full")}>
      {item.image_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.image_url} alt={item.title} className="w-full object-cover" />
      ) : null}
      <CardContent className="relative space-y-2 p-4">
        <div className="absolute right-2 top-3">
          <ActionsMenu item={item} collections={collections} />
        </div>
        <InspirationDetailDialog item={item} collections={collections}>
          <CardTrigger className="space-y-2 rounded-md pr-8">
            <span className="block font-medium leading-snug hover:underline">{item.title}</span>
            <div className="flex flex-wrap gap-1.5">
              <Badge variant="secondary">{item.source}</Badge>
              {item.category ? <Badge variant="outline">{item.category}</Badge> : null}
              {item.room ? <Badge variant="outline">{item.room}</Badge> : null}
              <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
            </div>
            {item.tags?.length ? (
              <p className="text-xs text-muted-foreground">{item.tags.map((t) => `#${t}`).join(" ")}</p>
            ) : null}
            {item.notes ? <p className="text-sm text-muted-foreground">{item.notes}</p> : null}
          </CardTrigger>
        </InspirationDetailDialog>
        {item.link ? (
          <a
            href={item.link}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            Open link <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}
      </CardContent>
    </Card>
  );
}

function InspirationRow({ item, collections }: { item: Inspiration; collections: Collection[] }) {
  return (
    <Card className="shadow-none">
      <CardContent className="flex items-center gap-3 p-3">
        {item.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.image_url} alt="" className="h-12 w-12 rounded-md object-cover" />
        ) : (
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
            {item.source.slice(0, 2)}
          </div>
        )}
        <InspirationDetailDialog item={item} collections={collections}>
          <CardTrigger className="min-w-0 flex-1 rounded-md">
            <span className="block truncate font-medium hover:underline">{item.title}</span>
            <p className="truncate text-xs text-muted-foreground">
              {[item.source, item.category, item.room].filter(Boolean).join(" · ")}
            </p>
          </CardTrigger>
        </InspirationDetailDialog>
        <Badge variant={priorityVariant(item.priority)}>{item.priority}</Badge>
        <ActionsMenu item={item} collections={collections} />
      </CardContent>
    </Card>
  );
}
