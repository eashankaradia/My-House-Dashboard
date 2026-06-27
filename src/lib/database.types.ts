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
  end_date: string | null;
  payment_account: string | null;
  account_id: string | null;
  is_fixed: boolean;
  notes: string | null;
};

export type PaymentAccount = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  owner_user_id: string | null;
  notes: string | null;
};

export type BillPayment = Timestamps & {
  id: string;
  user_id: string;
  bill_id: string;
  account_id: string | null;
  payment_date: string;
  expected_amount: number;
  actual_amount: number | null;
  notes: string | null;
  is_paid: boolean;
};

export type NotificationPreference = Timestamps & {
  id: string;
  user_id: string;
  entity_type: string;
  enabled: boolean;
};

export type Notification = {
  id: string;
  recipient_user_id: string;
  sender_user_id: string | null;
  entity_type: string | null;
  entity_id: string | null;
  title: string;
  message: string | null;
  href: string | null;
  read_at: string | null;
  created_at: string;
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
  non_negotiables: string | null;
  notes: string | null;
  status: PurchaseStatus;
  image_url: string | null;
  purchased_at: string | null;
  source_inspiration_id: string | null;
  archived_at: string | null;
  /** Out-of-5 star rating (null = unrated). */
  rating: number | null;
  /** Set when marked Purchased — all optional. */
  purchased_by: string | null;
  purchased_price: number | null;
  receipt_url: string | null;
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
  /** Out-of-5 star rating (null = unrated). */
  rating: number | null;
  /** Payment frequency for recurring costs; 'one-off' for a single price. */
  frequency: string;
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
  notes: string | null;
};

export type PurchaseStar = {
  id: string;
  purchase_id: string;
  user_id: string;
  created_at: string;
};

export type Comment = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  body: string;
  created_at: string;
};

export type CommentRead = {
  user_id: string;
  entity_type: string;
  entity_id: string;
  last_read_at: string;
};

export type Reaction = {
  id: string;
  user_id: string;
  entity_type: string;
  entity_id: string;
  emoji: string;
  created_at: string;
};

export type RoomOpening = { position: number; width: number; height?: number; label?: string };
export type RoomPoint = { x: number; y: number };
export type RoomDoor = { wall: "top" | "bottom" | "left" | "right"; offset: number; width: number };

export type Room = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
  updated_at?: string;
  shape: string;
  width_cm: number | null;
  length_cm: number | null;
  height_cm: number | null;
  wall_color: string | null;
  ceiling_color: string | null;
  floor_color: string | null;
  trim_color: string | null;
  flooring: string | null;
  doors: RoomDoor[];
  windows: RoomOpening[];
  outline: RoomPoint[] | null;
  notes: string | null;
  project_id: string | null;
};

export type RoomDesignStatus = "draft" | "comparing" | "chosen" | "archived";

export type RoomDesignVersion = Timestamps & {
  id: string;
  user_id: string;
  room_id: string;
  name: string;
  description: string | null;
  status: RoomDesignStatus;
  is_final: boolean;
  cost_estimate: number | null;
  width_cm: number | null;
  length_cm: number | null;
  height_cm: number | null;
  wall_color: string | null;
  ceiling_color: string | null;
  floor_color: string | null;
  trim_color: string | null;
  notes: string | null;
};

export type RoomLayoutItem = Timestamps & {
  id: string;
  user_id: string;
  version_id: string;
  name: string;
  category: string | null;
  width_cm: number;
  depth_cm: number;
  height_cm: number | null;
  x_cm: number;
  y_cm: number;
  rotation: number;
  color: string | null;
  material: string | null;
  notes: string | null;
  cost: number | null;
  priority: string | null;
  status: string;
  purchase_id: string | null;
  image_url: string | null;
};

export type RoomColourPalette = {
  id: string;
  user_id: string;
  room_id: string;
  version_id: string | null;
  name: string;
  created_at: string;
};

export type RoomColourSwatch = {
  id: string;
  user_id: string;
  palette_id: string;
  hex: string;
  label: string | null;
  position: number;
  created_at: string;
};

export type RoomDesignInspirationLink = {
  id: string;
  user_id: string;
  version_id: string;
  inspiration_id: string;
  created_at: string;
};

export type QuickPhoto = Timestamps & {
  id: string;
  user_id: string;
  image_url: string;
  label: string | null;
};

export type Draft = Timestamps & {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  notes: string | null;
  image_url: string | null;
};

export type ShoppingItem = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  quantity: string | null;
  category: string | null;
  is_got: boolean;
  got_at: string | null;
};

export type CalendarEvent = Timestamps & {
  id: string;
  user_id: string;
  title: string;
  event_date: string;
  recurrence: "none" | "weekly" | "monthly" | "yearly";
  notes: string | null;
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
  color: string | null;
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
  | "Note"
  | "Other";

// --- Minimal Database shape for the Supabase client generic ------------------

type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };

export type Database = {
  public: {
    Tables: {
      profiles: Row<Profile>;
      bills: Row<Bill>;
      payment_accounts: Row<PaymentAccount>;
      bill_payments: Row<BillPayment>;
      notification_preferences: Row<NotificationPreference>;
      notifications: Row<Notification>;
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
      calendar_events: Row<CalendarEvent>;
      project_tasks: Row<ProjectTask>;
      household_members: Row<HouseholdMember>;
      activity_log: Row<ActivityLog>;
      maintenance_tasks: Row<MaintenanceTask>;
      documents: Row<Document>;
      shopping_items: Row<ShoppingItem>;
      quick_photos: Row<QuickPhoto>;
      drafts: Row<Draft>;
      comments: Row<Comment>;
      comment_reads: Row<CommentRead>;
      reactions: Row<Reaction>;
      rooms: Row<Room>;
      room_design_versions: Row<RoomDesignVersion>;
      room_design_layout_items: Row<RoomLayoutItem>;
      room_colour_palettes: Row<RoomColourPalette>;
      room_colour_swatches: Row<RoomColourSwatch>;
      room_design_inspiration_links: Row<RoomDesignInspirationLink>;
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
