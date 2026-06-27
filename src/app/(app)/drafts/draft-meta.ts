/** Draft kinds and where each one becomes a real record. */
export const DRAFT_KINDS: { value: string; label: string; href: string }[] = [
  { value: "purchase", label: "Purchase", href: "/purchases" },
  { value: "idea", label: "Idea", href: "/inspiration" },
  { value: "task", label: "Task", href: "/projects" },
  { value: "project", label: "Project", href: "/projects" },
  { value: "maintenance", label: "Maintenance", href: "/maintenance" },
  { value: "bill", label: "Bill", href: "/bills" },
  { value: "note", label: "Note", href: "/documents" },
  { value: "other", label: "Other", href: "" },
];

export const draftMeta = (kind: string) => DRAFT_KINDS.find((k) => k.value === kind) ?? DRAFT_KINDS[DRAFT_KINDS.length - 1];
