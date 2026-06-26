import type { ActivityLog } from "@/lib/database.types";

export const ENTITY_LABEL: Record<string, string> = {
  bills: "bill",
  mortgages: "mortgage",
  savings_pots: "savings pot",
  savings_accounts: "savings account",
  savings_contributions: "savings contribution",
  collections: "collection",
  inspiration: "idea",
  projects: "project",
  project_tasks: "task",
  purchases: "purchase",
  purchase_options: "purchase option",
  maintenance_tasks: "maintenance task",
  documents: "document",
};

export const ACTION_VERB: Record<string, string> = {
  insert: "added",
  update: "updated",
  delete: "removed",
};

/**
 * A short, colour-coded tag shown next to an activity row so it's instantly
 * clear whether a change was to a purchase item itself or to one of its options.
 */
export const ENTITY_TAG: Record<string, { label: string; className: string }> = {
  purchases: {
    label: "Item",
    className: "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  },
  purchase_options: {
    label: "Option",
    className: "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  },
};

export const ENTITY_BASE: Record<string, string> = {
  bills: "/bills",
  mortgages: "/mortgage",
  savings_pots: "/savings",
  savings_accounts: "/savings",
  savings_contributions: "/savings",
  collections: "/inspiration",
  inspiration: "/inspiration",
  projects: "/projects",
  project_tasks: "/projects",
  purchases: "/purchases",
  purchase_options: "/purchases",
  maintenance_tasks: "/maintenance",
  documents: "/documents",
};

const ENTITY_PARAM: Record<string, string> = {
  bills: "item",
  savings_pots: "item",
  inspiration: "item",
  purchases: "item",
  maintenance_tasks: "item",
  documents: "item",
  projects: "project",
  project_tasks: "task",
};

export function activityHref(activity: ActivityLog): string | undefined {
  const base = ENTITY_BASE[activity.entity_type];
  if (!base) return undefined;
  const param = ENTITY_PARAM[activity.entity_type];
  if (param && activity.entity_id && activity.action !== "delete") {
    return `${base}?${param}=${activity.entity_id}`;
  }
  return base;
}
