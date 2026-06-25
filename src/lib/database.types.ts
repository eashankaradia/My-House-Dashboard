// ---------------------------------------------------------------------------
// Hand-written Supabase row types that mirror supabase/schema.sql.
// If you later run `supabase gen types typescript`, you can replace this file
// with the generated output — the app imports `Database` from here.
// ---------------------------------------------------------------------------

type Timestamps = {
  created_at: string;
  updated_at: string;
};

export type Profile = Timestamps & {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
};

export type Bill = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  category: BillCategory;
  amount: number;
  frequency: Frequency;
  due_date: string | null;
  payment_account: string | null;
  is_fixed: boolean;
  notes: string | null;
};

export type Mortgage = Timestamps & {
  id: string;
  user_id: string;
  property_name: string;
  property_value: number;
  mortgage_balance: number;
  interest_rate: number;
  monthly_payment: number;
  term_months: number | null;
  start_date: string | null;
  fixed_term_end_date: string | null;
  provider: string | null;
  notes: string | null;
};

export type SavingsPot = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  monthly_contribution: number;
  target_date: string | null;
  color: string;
  icon: string | null;
  notes: string | null;
};

export type SavingsAccount = Timestamps & {
  id: string;
  user_id: string;
  pot_id: string;
  name: string;
  notes: string | null;
};

export type SavingsContribution = {
  id: string;
  user_id: string;
  pot_id: string;
  account_id: string | null;
  amount: number;
  occurred_on: string;
  note: string | null;
  created_at: string;
};

export type Collection = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  cover_image: string | null;
};

export type Inspiration = Timestamps & {
  id: string;
  user_id: string;
  title: string;
  link: string | null;
  source: InspirationSource;
  category: string | null;
  room: string | null;
  tags: string[];
  notes: string | null;
  priority: Priority;
  status: InspirationStatus;
  image_url: string | null;
  collection_id: string | null;
};

export type Project = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  category: ProjectCategory;
  description: string | null;
  estimated_cost: number;
  actual_cost: number;
  priority: Priority;
  status: ProjectStatus;
  target_completion_date: string | null;
  notes: string | null;
  image_url: string | null;
  source_inspiration_id: string | null;
  archived_at: string | null;
};

export type Purchase = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  url: string | null;
  store: string | null;
  price: number;
  category: PurchaseCategory;
  sub_category: string | null;
  room: string | null;
  priority: Priority;
  notes: string | null;
  status: PurchaseStatus;
  image_url: string | null;
  purchased_at: string | null;
  source_inspiration_id: string | null;
  archived_at: string | null;
};

export type PurchaseOption = Timestamps & {
  id: string;
  user_id: string;
  purchase_id: string;
  name: string;
  store: string | null;
  url: string | null;
  price: number;
  image_url: string | null;
  notes: string | null;
  is_chosen: boolean;
  rank: number;
  start_price: number;
};

/** A purchase with its compared options attached (used in list views). */
export type PurchaseWithOptions = Purchase & { options: PurchaseOption[] };

/** A purchase plus its household stars (who marked it a favourite). */
export type PurchaseStarInfo = { user_id: string; name: string };

export type MaintenanceTask = Timestamps & {
  id: string;
  user_id: string;
  task: string;
  frequency: MaintenanceFrequency;
  last_completed_date: string | null;
  next_due_date: string | null;
  cost: number;
  notes: string | null;
};

export type Document = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  category: DocumentCategory;
  file_path: string | null;
  file_size: number | null;
  mime_type: string | null;
  expiry_date: string | null;
  notes: string | null;
};

// --- Enumerations (kept in sync with the CHECK constraints in schema.sql) ----

export type Frequency = "weekly" | "monthly" | "quarterly" | "annually" | "one-off";
export type Priority = "Low" | "Medium" | "High";

export type BillCategory =
  | "Mortgage"
  | "Utilities"
  | "Council Tax"
  | "Broadband"
  | "Mobile"
  | "Insurance"
  | "Subscriptions"
  | "Maintenance"
  | "Other";

export type ProjectCategory =
  | "Garden"
  | "Kitchen"
  | "Bathroom"
  | "Bedroom"
  | "Living Room"
  | "Exterior"
  | "Storage"
  | "General";

export type ProjectStatus =
  | "Idea"
  | "Planning"
  | "Quoting"
  | "Scheduled"
  | "In Progress"
  | "Completed";

export type PurchaseCategory =
  | "Furniture"
  | "Appliances"
  | "Technology"
  | "Garden"
  | "Decor"
  | "Tools"
  | "Storage"
  | "Other";

export type PurchaseStatus =
  | "Interesting"
  | "Considering"
  | "Shortlisted"
  | "Ready To Buy"
  | "Purchased";

export type ProjectTask = Timestamps & {
  id: string;
  user_id: string;
  project_id: string | null;
  title: string;
  is_done: boolean;
  due_date: string | null;
  position: number;
  assigned_to: string | null;
  archived_at: string | null;
};

export type PurchaseStar = {
  id: string;
  purchase_id: string;
  user_id: string;
  created_at: string;
};

export type LinkType = "task" | "project" | "purchase" | "bill" | "inspiration";

export type Link = {
  id: string;
  user_id: string;
  a_type: LinkType;
  a_id: string;
  b_type: LinkType;
  b_id: string;
  created_at: string;
};

export type HouseholdMember = {
  user_id: string;
  display_name: string;
  household_id: string;
  created_at: string;
};

export type ActivityLog = {
  id: number;
  user_id: string | null;
  action: "insert" | "update" | "delete";
  entity_type: string;
  entity_id: string | null;
  entity_label: string | null;
  created_at: string;
};

export type ProjectWithTasks = Project & { tasks: ProjectTask[] };

export type InspirationSource =
  | "Instagram"
  | "TikTok"
  | "Pinterest"
  | "YouTube"
  | "Blog"
  | "Store"
  | "Other";

export type InspirationStatus = "Saved" | "Considering" | "Planned" | "Implemented";

export type MaintenanceFrequency =
  | "weekly"
  | "monthly"
  | "quarterly"
  | "biannually"
  | "annually";

export type DocumentCategory =
  | "Mortgage"
  | "Insurance"
  | "Warranties"
  | "Manuals"
  | "Quotes"
  | "Certificates"
  | "Receipts"
  | "Other";

// --- Minimal Database shape for the Supabase client generic ------------------

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>;
      bills: Row<Bill>;
      mortgages: Row<Mortgage>;
      savings_pots: Row<SavingsPot>;
      savings_accounts: Row<SavingsAccount>;
      savings_contributions: Row<SavingsContribution>;
      collections: Row<Collection>;
      inspiration: Row<Inspiration>;
      projects: Row<Project>;
      purchases: Row<Purchase>;
      purchase_options: Row<PurchaseOption>;
      purchase_stars: Row<PurchaseStar>;
      links: Row<Link>;
      project_tasks: Row<ProjectTask>;
      household_members: Row<HouseholdMember>;
      activity_log: Row<ActivityLog>;
      maintenance_tasks: Row<MaintenanceTask>;
      documents: Row<Document>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
