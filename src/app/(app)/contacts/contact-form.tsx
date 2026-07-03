"use client";

import * as React from "react";
import { UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Field } from "@/components/shared/form-field";
import { useToast } from "@/hooks/use-toast";
import { CONTACT_ROLES } from "@/lib/constants";
import type { Contact } from "@/lib/database.types";
import { createContact, updateContact } from "./actions";

interface ContactFormProps {
  contact?: Contact;
  trigger?: React.ReactNode;
}

export function ContactForm({ contact, trigger }: ContactFormProps) {
  const [open, setOpen] = React.useState(false);
  const [pending, startTransition] = React.useTransition();
  const formRef = React.useRef<HTMLFormElement>(null);
  const { toast } = useToast();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = contact
        ? await updateContact(contact.id, formData)
        : await createContact(formData);
      if (result?.error) {
        toast({ variant: "destructive", title: "Couldn't save contact", description: result.error });
        return;
      }
      toast({ title: contact ? "Contact updated" : "Contact saved" });
      setOpen(false);
      formRef.current?.reset();
    });
  }

  const listId = "contact-roles";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button>
            <UserPlus className="h-4 w-4" /> Add contact
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{contact ? "Edit contact" : "Add contact"}</DialogTitle>
        </DialogHeader>
        <form ref={formRef} onSubmit={onSubmit} className="space-y-4">
          <datalist id={listId}>
            {CONTACT_ROLES.map((r) => (
              <option key={r} value={r} />
            ))}
          </datalist>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" htmlFor="c-name" required>
              <Input
                id="c-name"
                name="name"
                defaultValue={contact?.name}
                placeholder="e.g. Dave's Plumbing"
                required
              />
            </Field>
            <Field label="Role / Type" htmlFor="c-role">
              <Input
                id="c-role"
                name="role"
                defaultValue={contact?.role ?? ""}
                placeholder="e.g. Plumber"
                list={listId}
              />
            </Field>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone" htmlFor="c-phone">
              <Input
                id="c-phone"
                name="phone"
                type="tel"
                defaultValue={contact?.phone ?? ""}
                placeholder="+44 7700 000000"
              />
            </Field>
            <Field label="Email" htmlFor="c-email">
              <Input
                id="c-email"
                name="email"
                type="email"
                defaultValue={contact?.email ?? ""}
                placeholder="hello@example.com"
              />
            </Field>
          </div>

          <Field label="Website" htmlFor="c-url">
            <Input
              id="c-url"
              name="url"
              type="url"
              defaultValue={contact?.url ?? ""}
              placeholder="https://example.com"
            />
          </Field>

          <Field label="Address" htmlFor="c-address">
            <Input
              id="c-address"
              name="address"
              defaultValue={contact?.address ?? ""}
              placeholder="123 Main Street, London"
            />
          </Field>

          <Field label="Notes" htmlFor="c-notes">
            <Textarea
              id="c-notes"
              name="notes"
              rows={3}
              defaultValue={contact?.notes ?? ""}
              placeholder="Any extra details…"
            />
          </Field>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={pending}>
              Cancel
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : contact ? "Save changes" : "Add contact"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
