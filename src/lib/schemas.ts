import { z } from "zod";
import {
  BILL_CATEGORIES,
  DOCUMENT_CATEGORIES,
  FREQUENCIES,
  INSPIRATION_SOURCES,
  INSPIRATION_STATUSES,
  MAINTENANCE_FREQUENCIES,
  PRIORITIES,
  PROJECT_CATEGORIES,
  PROJECT_STATUSES,
  PURCHASE_SIZES,
  PURCHASE_STATUSES,
} from "@/lib/constants";

// Coerce empty strings from inputs to undefined → null on the server.
const optionalString = z.string().trim().max(2000).optional().or(z.literal("")).transform((v) => v || undefined);
const optionalDate = z.string().optional().or(z.literal("")).transform((v) => v || undefined);
const money = z.coerce.number().min(0, "Must be 0 or more").max(1_000_000_000);

export const billSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.enum(BILL_CATEGORIES),
  amount: money,
  frequency: z.enum(FREQUENCIES),
  start_date: optionalDate,
  due_date: optionalDate,
  end_date: optionalDate,
  account_id: optionalString,
  is_fixed: z.coerce.boolean().default(true),
  notes: optionalString,
});
export type BillInput = z.infer<typeof billSchema>;

export const paymentAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  owner_user_id: optionalString,
  notes: optionalString,
});
export type PaymentAccountInput = z.infer<typeof paymentAccountSchema>;

export const billPaymentSchema = z.object({
  payment_date: z.string().min(1, "Payment date is required"),
  expected_amount: money,
  actual_amount: z.coerce.number().min(0).optional(),
  account_id: optionalString,
  notes: optionalString,
});
export type BillPaymentInput = z.infer<typeof billPaymentSchema>;

export const mortgageSchema = z.object({
  property_name: z.string().trim().min(1, "Required").max(120).default("My Home"),
  property_value: money,
  mortgage_balance: money,
  interest_rate: z.coerce.number().min(0).max(100),
  monthly_payment: money,
  term_months: z.coerce.number().int().min(0).max(600).optional(),
  start_date: optionalDate,
  fixed_term_end_date: optionalDate,
  provider: optionalString,
  notes: optionalString,
});
export type MortgageInput = z.infer<typeof mortgageSchema>;

export const savingsPotSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  target_amount: money,
  current_amount: money,
  monthly_contribution: money,
  target_date: optionalDate,
  color: z.string().default("emerald"),
  notes: optionalString,
});
export type SavingsPotInput = z.infer<typeof savingsPotSchema>;

export const savingsAccountSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  notes: optionalString,
  // Optional opening balance — logged as the account's first contribution.
  opening_balance: money.optional(),
  opening_date: optionalDate,
});
export type SavingsAccountInput = z.infer<typeof savingsAccountSchema>;

export const savingsContributionSchema = z.object({
  // Magnitude only; the deposit/withdrawal direction is applied separately.
  amount: z.coerce.number().positive("Enter an amount above 0").max(1_000_000_000),
  direction: z.enum(["deposit", "withdrawal"]).default("deposit"),
  account_id: optionalString,
  occurred_on: z.string().min(1, "Pick a date"),
  note: optionalString,
});
export type SavingsContributionInput = z.infer<typeof savingsContributionSchema>;

export const projectSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  category: z.enum(PROJECT_CATEGORIES),
  description: optionalString,
  estimated_cost: money,
  actual_cost: money,
  priority: z.enum(PRIORITIES),
  status: z.enum(PROJECT_STATUSES),
  target_completion_date: optionalDate,
  notes: optionalString,
  image_url: optionalString,
});
export type ProjectInput = z.infer<typeof projectSchema>;

const rating = z.coerce.number().int().min(0).max(5).optional();

export const purchaseSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  url: optionalString,
  store: optionalString,
  price: money,
  category: z.string().trim().min(1, "Category is required").max(80),
  size: z.enum(PURCHASE_SIZES).optional().or(z.literal("")).transform((v) => v || undefined),
  room: optionalString,
  priority: z.enum(PRIORITIES),
  status: z.enum(PURCHASE_STATUSES),
  non_negotiables: optionalString,
  notes: optionalString,
  purchased_by: optionalString,
  purchased_price: z.coerce.number().min(0).max(1_000_000_000).optional(),
  receipt_url: optionalString,
});
export type PurchaseInput = z.infer<typeof purchaseSchema>;

const dimension = z.coerce.number().min(0).max(2000).optional();

export const purchaseOptionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  store: optionalString,
  url: optionalString,
  price: money,
  image_url: optionalString,
  notes: optionalString,
  rating,
  frequency: z.enum(FREQUENCIES).default("one-off"),
  shape: optionalString,
  width_cm: dimension,
  depth_cm: dimension,
  height_cm: dimension,
});
export type PurchaseOptionInput = z.infer<typeof purchaseOptionSchema>;

export const inspirationSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  link: optionalString,
  source: z.enum(INSPIRATION_SOURCES),
  category: optionalString,
  room: optionalString,
  tags: optionalString, // comma-separated in the form; split on the server
  notes: optionalString,
  priority: z.enum(PRIORITIES),
  status: z.enum(INSPIRATION_STATUSES),
  image_url: optionalString,
  collection_id: optionalString,
});
export type InspirationInput = z.infer<typeof inspirationSchema>;

export const collectionSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: optionalString,
});
export type CollectionInput = z.infer<typeof collectionSchema>;

export const maintenanceSchema = z.object({
  task: z.string().trim().min(1, "Task is required").max(160),
  frequency: z.enum(MAINTENANCE_FREQUENCIES),
  last_completed_date: optionalDate,
  next_due_date: optionalDate,
  cost: money,
  notes: optionalString,
});
export type MaintenanceInput = z.infer<typeof maintenanceSchema>;

export const usefulLinkSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(160),
  url: z.string().trim().url("Enter a valid URL (include https://)").max(2000),
  description: optionalString,
});
export type UsefulLinkInput = z.infer<typeof usefulLinkSchema>;

export const documentSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(160),
  category: z.enum(DOCUMENT_CATEGORIES),
  expiry_date: optionalDate,
  notes: optionalString,
});
export type DocumentInput = z.infer<typeof documentSchema>;
