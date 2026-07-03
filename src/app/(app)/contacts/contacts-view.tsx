"use client";

import * as React from "react";
import { SearchInput } from "@/components/shared/search-input";
import type { Contact } from "@/lib/database.types";
import { ContactCard } from "./contact-card";

export function ContactsView({ contacts }: { contacts: Contact[] }) {
  const [search, setSearch] = React.useState("");

  const visible = !search.trim()
    ? contacts
    : contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.trim().toLowerCase()) ||
          (c.role?.toLowerCase().includes(search.trim().toLowerCase()) ?? false),
      );

  return (
    <div className="space-y-4">
      {contacts.length > 5 ? (
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search by name or role…"
          className="max-w-xs"
        />
      ) : null}

      {visible.length === 0 ? (
        <p className="py-6 text-center text-sm text-muted-foreground">
          No contacts match &ldquo;{search}&rdquo;.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((contact) => (
            <ContactCard key={contact.id} contact={contact} />
          ))}
        </div>
      )}
    </div>
  );
}
