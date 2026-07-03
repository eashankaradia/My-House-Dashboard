import { BookUser } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import type { Contact } from "@/lib/database.types";
import { ContactForm } from "./contact-form";
import { ContactsView } from "./contacts-view";

export const metadata = { title: "Key Contacts" };

export default async function ContactsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contacts")
    .select("*")
    .order("name", { ascending: true });

  const contacts = (data ?? []) as Contact[];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Key Contacts"
        description="Important people and services for your household."
        info="Store tradespeople, neighbours, emergency numbers, and anyone else your household calls regularly."
      >
        <ContactForm />
      </PageHeader>

      {contacts.length === 0 ? (
        <EmptyState
          icon={BookUser}
          title="No contacts yet"
          description="Add plumbers, electricians, neighbours, or anyone else your household calls regularly."
        >
          <ContactForm />
        </EmptyState>
      ) : (
        <ContactsView contacts={contacts} />
      )}
    </div>
  );
}
