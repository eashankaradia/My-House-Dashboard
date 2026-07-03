"use client";

import * as React from "react";
import { ExternalLink, Globe, Mail, MapPin, Pencil, Phone } from "lucide-react";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { ContactForm } from "./contact-form";
import { deleteContact } from "./actions";
import type { Contact } from "@/lib/database.types";
import { cn } from "@/lib/utils";

const AVATAR_PALETTE = [
  "bg-rose-500",
  "bg-orange-500",
  "bg-amber-500",
  "bg-lime-600",
  "bg-emerald-500",
  "bg-teal-500",
  "bg-cyan-600",
  "bg-sky-500",
  "bg-blue-500",
  "bg-violet-500",
  "bg-purple-500",
  "bg-pink-500",
  "bg-fuchsia-500",
  "bg-red-500",
];

function avatarColor(name: string): string {
  return AVATAR_PALETTE[name.charCodeAt(0) % AVATAR_PALETTE.length];
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const [expanded, setExpanded] = React.useState(false);

  return (
    <div className="group relative flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-sm transition-shadow hover:shadow-md">
      {/* Header row */}
      <div className="flex items-start gap-3">
        <span
          className={cn(
            "flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white",
            avatarColor(contact.name),
          )}
        >
          {initials(contact.name)}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold leading-tight">{contact.name}</p>
          {contact.role ? (
            <span className="mt-0.5 inline-block rounded-full bg-secondary px-2 py-0.5 text-[11px] font-medium text-secondary-foreground">
              {contact.role}
            </span>
          ) : null}
        </div>
        {/* Edit / delete — visible on hover */}
        <div className="flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity group-hover:opacity-100">
          <ContactForm
            contact={contact}
            trigger={
              <button
                aria-label="Edit contact"
                className="flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-accent hover:text-foreground active:scale-90"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            }
          />
          <ConfirmDelete itemLabel="contact" action={deleteContact.bind(null, contact.id)} />
        </div>
      </div>

      {/* Contact actions */}
      <div className="flex flex-wrap gap-2">
        {contact.phone ? (
          <a
            href={`tel:${contact.phone}`}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent active:scale-95"
          >
            <Phone className="h-3.5 w-3.5 text-primary" />
            {contact.phone}
          </a>
        ) : null}
        {contact.email ? (
          <a
            href={`mailto:${contact.email}`}
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent active:scale-95"
          >
            <Mail className="h-3.5 w-3.5 text-primary" />
            <span className="max-w-[160px] truncate">{contact.email}</span>
          </a>
        ) : null}
        {contact.url ? (
          <a
            href={contact.url}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-accent active:scale-95"
          >
            <Globe className="h-3.5 w-3.5 text-primary" />
            <ExternalLink className="h-3 w-3 text-muted-foreground" />
          </a>
        ) : null}
      </div>

      {/* Address + notes */}
      {(contact.address || contact.notes) ? (
        <>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="text-left text-xs text-muted-foreground hover:text-foreground"
          >
            {expanded ? "Less ▲" : "More ▼"}
          </button>
          {expanded ? (
            <div className="space-y-1.5">
              {contact.address ? (
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                  {contact.address}
                </p>
              ) : null}
              {contact.notes ? (
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">{contact.notes}</p>
              ) : null}
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
