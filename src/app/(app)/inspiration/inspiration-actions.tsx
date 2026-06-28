"use client";

import { FolderPlus, MoreHorizontal, PanelTop } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Collection } from "@/lib/database.types";
import { CollectionForm } from "./collection-form";
import { InspirationForm } from "./inspiration-form";
import { PinterestBoardImport } from "./pinterest-board-import";

export function InspirationActions({ collections }: { collections: Collection[] }) {
  return (
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
      <div className="hidden sm:block">
        <CollectionForm />
      </div>
      <InspirationForm collections={collections} trigger={<Button className="min-w-0 flex-1 sm:flex-none">Save idea</Button>} />
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="shrink-0 rounded-full" aria-label="More inspiration actions">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <CollectionForm
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <FolderPlus className="h-4 w-4" /> New collection
              </DropdownMenuItem>
            }
          />
          <PinterestBoardImport
            trigger={
              <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                <PanelTop className="h-4 w-4" /> Pinterest board
              </DropdownMenuItem>
            }
          />
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
