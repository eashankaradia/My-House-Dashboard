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
  start_date: string | null;
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

export type BillContributor = Timestamps & {
  id: string;
  bill_id: string;
  user_id: string;
  member_id: string;
  amount: number | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
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
  pot_type: string;
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
  category: string;
  sub_category: string | null;
  /** "Small" | "Big" | null — big-ticket vs everyday purchase. */
  size: string | null;
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
  /** Furniture footprint, for dropping into the Room Designer. */
  shape: string | null;
  width_cm: number | null;
  depth_cm: number | null;
  height_cm: number | null;
};

export type PurchaseCategoryRow = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
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

export type PurchaseCategory = string;

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
export type RoomDoor = {
  wall: "top" | "bottom" | "left" | "right";
  offset: number;
  width: number;
  /** When true, the hinge is on the opposite jamb, flipping the door swing. */
  flipped?: boolean;
  /** When true, the door swings away from the room instead of into it. */
  opens_out?: boolean;
};

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
  option_id: string | null;
  /** Footprint shape: "rectangle" | "square" | "round" | null. */
  shape: string | null;
  image_url: string | null;
  locked: boolean;
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

export type UsefulLink = Timestamps & {
  id: string;
  user_id: string;
  title: string;
  url: string;
  description: string | null;
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

export type HouseholdInvite = {
  id: string;
  household_id: string;
  code: string;
  created_by: string;
  created_at: string;
  expires_at: string | null;
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

// ---------------------------------------------------------------------------
// MyLife personal modules
// ---------------------------------------------------------------------------

export type Habit = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  frequency: string;
  target_count: number;
  color: string | null;
  is_active: boolean;
  start_date: string | null;
  habit_type: string;
  why: string | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
};

export type HabitLog = {
  id: string;
  user_id: string;
  habit_id: string;
  logged_date: string;
  count: number;
  value: number | null;
  duration_seconds: number | null;
  notes: string | null;
  created_at: string;
};

export type HabitTarget = {
  id: string;
  user_id: string;
  habit_id: string;
  period: string;
  target_value: number;
  created_at: string;
};

export type Goal = {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  category: string;
  target_value: number | null;
  current_value: number | null;
  unit: string | null;
  target_date: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type JournalEntry = {
  id: string;
  user_id: string;
  entry_date: string;
  mood: string | null;
  mood_score: number | null;
  content: string | null;
  gratitude: string | null;
  photo_url: string | null;
  created_at: string;
  updated_at: string;
};

export type Workout = {
  id: string;
  user_id: string;
  name: string;
  workout_date: string;
  duration_minutes: number | null;
  workout_type: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutExercise = {
  id: string;
  user_id: string;
  workout_id: string;
  name: string;
  sets: number | null;
  reps: number | null;
  weight_kg: number | null;
  duration_seconds: number | null;
  distance_meters: number | null;
  notes: string | null;
  created_at: string;
};

export type Exercise = {
  id: string;
  user_id: string;
  name: string;
  muscle_groups: string[];
  technique: string | null;
  inspiration: string | null;
  pb_value: number | null;
  pb_unit: string | null;
  pb_date: string | null;
  created_at: string;
  updated_at: string;
};

export type WorkoutPlan = {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type WorkoutPlanExercise = {
  id: string;
  user_id: string;
  plan_id: string;
  exercise_id: string;
  sets: number | null;
  reps: number | null;
  target_weight_kg: number | null;
  order_index: number;
  notes: string | null;
  created_at: string;
};

export type HealthRecord = {
  id: string;
  user_id: string;
  record_type: string;
  value: number | null;
  value2: number | null;
  unit: string | null;
  notes: string | null;
  recorded_at: string;
  created_at: string;
};

export type Medication = {
  id: string;
  user_id: string;
  name: string;
  dosage: string | null;
  frequency: string | null;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  title: string;
  provider: string | null;
  appointment_date: string;
  appointment_time: string | null;
  location: string | null;
  notes: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

export type HealthInspiration = {
  id: string;
  user_id: string;
  kind: string;
  title: string;
  url: string | null;
  image_url: string | null;
  source: string | null;
  content: string | null;
  created_at: string;
  updated_at: string;
};

export type NutritionLog = {
  id: string;
  user_id: string;
  log_date: string;
  meal_type: string;
  name: string;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  created_at: string;
};

export type Recipe = {
  id: string;
  user_id: string;
  name: string;
  video_url: string | null;
  image_url: string | null;
  servings: number | null;
  calories: number | null;
  protein_g: number | null;
  carbs_g: number | null;
  fat_g: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type RecipeIngredient = {
  id: string;
  user_id: string;
  recipe_id: string;
  name: string;
  quantity: string | null;
  order_index: number;
  created_at: string;
};

export type FinanceSettings = {
  id: string;
  user_id: string;
  monthly_income: number | null;
  income_label: string;
  annual_salary: number | null;
  employer: string | null;
  salary_notes: string | null;
  updated_at: string;
};

export type Budget = Timestamps & {
  id: string;
  user_id: string;
  category: string;
  monthly_limit: number;
  notes: string | null;
};

export type IncomeMonth = Timestamps & {
  id: string;
  user_id: string;
  month: string;
  net_income: number;
  bonus: number;
  notes: string | null;
};

export type CreditCard = Timestamps & {
  id: string;
  user_id: string;
  name: string;
  last4: string | null;
  statement_day: number | null;
  notes: string | null;
};

export type CreditCardStatement = Timestamps & {
  id: string;
  user_id: string;
  card_id: string;
  statement_month: string;
  amount: number;
  is_paid: boolean;
  notes: string | null;
};

export type PotContributionSchedule = Timestamps & {
  id: string;
  user_id: string;
  pot_id: string;
  amount: number;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
};

export type PotContributionOverride = {
  id: string;
  user_id: string;
  pot_id: string;
  month: string;
  amount: number;
  notes: string | null;
  created_at: string;
};

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
  | "Tax"
  | "Utilities"
  | "Contracts"
  | "Legal"
  | "Vehicle"
  | "Medical"
  | "Identity"
  | "Banking"
  | "Appliances"
  | "Garden"
  | "Pets"
  | "Travel"
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
      bill_contributors: Row<BillContributor>;
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
      purchase_categories: Row<PurchaseCategoryRow>;
      purchase_options: Row<PurchaseOption>;
      purchase_stars: Row<PurchaseStar>;
      links: Row<Link>;
      calendar_events: Row<CalendarEvent>;
      project_tasks: Row<ProjectTask>;
      household_members: Row<HouseholdMember>;
      household_invites: Row<HouseholdInvite>;
      activity_log: Row<ActivityLog>;
      maintenance_tasks: Row<MaintenanceTask>;
      documents: Row<Document>;
      shopping_items: Row<ShoppingItem>;
      quick_photos: Row<QuickPhoto>;
      drafts: Row<Draft>;
      useful_links: Row<UsefulLink>;
      comments: Row<Comment>;
      comment_reads: Row<CommentRead>;
      reactions: Row<Reaction>;
      rooms: Row<Room>;
      room_design_versions: Row<RoomDesignVersion>;
      room_design_layout_items: Row<RoomLayoutItem>;
      room_colour_palettes: Row<RoomColourPalette>;
      room_colour_swatches: Row<RoomColourSwatch>;
      room_design_inspiration_links: Row<RoomDesignInspirationLink>;
      habits: Row<Habit>;
      habit_logs: Row<HabitLog>;
      habit_targets: Row<HabitTarget>;
      goals: Row<Goal>;
      journal_entries: Row<JournalEntry>;
      workouts: Row<Workout>;
      workout_exercises: Row<WorkoutExercise>;
      exercises: Row<Exercise>;
      workout_plans: Row<WorkoutPlan>;
      workout_plan_exercises: Row<WorkoutPlanExercise>;
      health_records: Row<HealthRecord>;
      medications: Row<Medication>;
      appointments: Row<Appointment>;
      health_inspiration: Row<HealthInspiration>;
      nutrition_logs: Row<NutritionLog>;
      recipes: Row<Recipe>;
      recipe_ingredients: Row<RecipeIngredient>;
      finance_settings: Row<FinanceSettings>;
      budgets: Row<Budget>;
      income_months: Row<IncomeMonth>;
      credit_cards: Row<CreditCard>;
      credit_card_statements: Row<CreditCardStatement>;
      pot_contribution_schedules: Row<PotContributionSchedule>;
      pot_contribution_overrides: Row<PotContributionOverride>;
    };
    Views: { [_ in never]: never };
    Functions: {
      redeem_household_invite: {
        Args: { p_code: string };
        Returns: boolean;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
