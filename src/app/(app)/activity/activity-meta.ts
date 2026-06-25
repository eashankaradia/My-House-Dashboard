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
