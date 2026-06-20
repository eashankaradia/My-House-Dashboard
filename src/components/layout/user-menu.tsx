"use client";

import * as React from "react";
import { LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { initialsFromName } from "@/lib/utils";

type Props = {
  name?: string | null;
  email?: string | null;
  avatarUrl?: string | null;
};

export function UserMenu({ name, email, avatarUrl }: Props) {
  const formRef = React.useRef<HTMLFormElement>(null);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="rounded-full outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring">
        <Avatar>
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={name ?? "User"} /> : null}
          <AvatarFallback>{initialsFromName(name, email)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex flex-col">
          <span className="truncate">{name ?? "Signed in"}</span>
          <span className="truncate text-xs font-normal text-muted-foreground">{email}</span>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <form ref={formRef} action="/auth/signout" method="post" />
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onSelect={() => formRef.current?.requestSubmit()}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
