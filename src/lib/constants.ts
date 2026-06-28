import {
  LayoutDashboard,
  Receipt,
  Home,
  PiggyBank,
  Hammer,
  ShoppingBag,
  ShoppingCart,
  Sofa,
  Camera,
  Lightbulb,
  Wrench,
  FolderArchive,
  BarChart3,
  CalendarDays,
  History,
  FileText,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  /** Short label for tight spaces like the phone bottom bar. Falls back to title. */
  short?: string;
  href: string;
  icon: LucideIcon;
  description: string;
  /** Sidebar section this item belongs to. */
  group: string;
};

/** Order the sidebar groups appear in. */
export const NAV_GROUPS = ["Overview", "Money", "Planning", "Home", "Capture", "Calendar"] as const;

/** Primary navigation — drives both the desktop sidebar and mobile menu. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", short: "Home", href: "/dashboard", icon: LayoutDashboard, description: "Your home command centre", group: "Overview" },
  { title: "Bills & Expenses", short: "Bills", href: "/bills", icon: Receipt, description: "Recurring household costs", group: "Money" },
  { title: "Mortgage", href: "/mortgage", icon: Home, description: "Balance, equity & payoff", group: "Money" },
  { title: "Savings Pots", short: "Savings", href: "/savings", icon: PiggyBank, description: "Goals & contributions", group: "Money" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, description: "Trends & breakdowns", group: "Money" },
  { title: "Projects & Tasks", short: "Projects", href: "/projects", icon: Hammer, description: "Plan projects and track to-dos", group: "Planning" },
  { title: "Room Designer", short: "Rooms", href: "/rooms", icon: Sofa, description: "Design each room before you buy", group: "Planning" },
  { title: "Future Purchases", short: "Purchases", href: "/purchases", icon: ShoppingBag, description: "Your home wishlist", group: "Planning" },
  { title: "Inspiration", href: "/inspiration", icon: Lightbulb, description: "Ideas & link collections", group: "Planning" },
  { title: "Groceries", short: "Shop", href: "/shopping", icon: ShoppingCart, description: "Shared shopping list", group: "Home" },
  { title: "Maintenance", short: "Upkeep", href: "/maintenance", icon: Wrench, description: "Reminders & servicing", group: "Home" },
  { title: "Documents & notes", short: "Docs", href: "/documents", icon: FolderArchive, description: "Warranties, insurance, notes & more", group: "Home" },
  { title: "Photos", short: "Photos", href: "/photos", icon: Camera, description: "Quick snaps to label later", group: "Capture" },
  { title: "Drafts", short: "Drafts", href: "/drafts", icon: FileText, description: "Half-formed ideas saved for later", group: "Capture" },
  { title: "Calendar", href: "/calendar", icon: CalendarDays, description: "Key dates at a glance", group: "Calendar" },
  { title: "Change log", short: "Log", href: "/activity", icon: History, description: "Who changed what, and when", group: "Calendar" },
];

/** Tabs that can never be hidden from the sidebar. */
export const ALWAYS_VISIBLE = ["/dashboard"] as const;

export const NOTIFICATION_ENTITY_TYPES = [
  ["bills", "Bills"],
  ["mortgages", "Mortgage"],
  ["savings_pots", "Savings"],
  ["projects", "Projects"],
  ["project_tasks", "Tasks"],
  ["purchases", "Purchases"],
  ["inspiration", "Inspiration"],
  ["maintenance_tasks", "Maintenance"],
  ["documents", "Documents"],
] as const;

// --- Option lists shared by forms (kept in sync with schema CHECK lists) -----

export const BILL_CATEGORIES = [
  "Mortgage", "Utilities", "Council Tax", "Broadband", "Mobile",
  "Insurance", "Subscriptions", "Maintenance", "Other",
] as const;

export const FREQUENCIES = ["weekly", "monthly", "quarterly", "annually", "one-off"] as const;

export const PRIORITIES = ["Low", "Medium", "High"] as const;

/** Footprint shapes a furniture option can be placed as in the Room Designer. */
export const OPTION_SHAPES = ["rectangle", "square", "round"] as const;
export const OPTION_SHAPE_LABELS: Record<string, string> = {
  rectangle: "Rectangle",
  square: "Square",
  round: "Round / Oval",
};

export const PROJECT_CATEGORIES = [
  "Garden", "Kitchen", "Bathroom", "Bedroom", "Living Room", "Exterior", "Storage", "General",
] as const;

export const PROJECT_STATUSES = [
  "Idea", "Planning", "Quoting", "Scheduled", "In Progress", "Completed",
] as const;

export const PURCHASE_CATEGORIES = [
  "Furniture", "Appliances", "Technology", "Garden", "Decor", "Tools", "Storage", "Other",
] as const;

export const PURCHASE_STATUSES = [
  "Interesting", "Considering", "Shortlisted", "Ready To Buy", "Purchased",
] as const;

/** Whether a purchase is a big-ticket or a small everyday buy. */
export const PURCHASE_SIZES = ["Small", "Big"] as const;

export const INSPIRATION_SOURCES = [
  "Instagram", "TikTok", "Pinterest", "YouTube", "Blog", "Store", "Other",
] as const;

export const INSPIRATION_CATEGORIES = [
  "Garden", "Kitchen", "Living Room", "Bedroom", "Bathroom", "Storage", "DIY", "Renovation", "Decor",
] as const;

export const INSPIRATION_STATUSES = ["Saved", "Considering", "Planned", "Implemented"] as const;

export const MAINTENANCE_FREQUENCIES = [
  "weekly", "monthly", "quarterly", "biannually", "annually",
] as const;

export const DOCUMENT_CATEGORIES = [
  "Mortgage", "Insurance", "Warranties", "Manuals", "Quotes", "Certificates", "Receipts", "Note", "Other",
] as const;

export const ROOMS = [
  "Kitchen", "Living Room", "Bedroom", "Bathroom", "Garden", "Hallway",
  "Dining Room", "Office", "Garage", "Loft", "Exterior", "Whole House",
] as const;

/** Tailwind-friendly accent colours for savings pots. */
export const POT_COLORS = [
  "emerald", "sky", "violet", "amber", "rose", "teal", "indigo", "orange",
] as const;

/**
 * Personal colours a household member can pick for their name. Class strings
 * are listed literally so Tailwind keeps them in the build.
 */
export const MEMBER_COLORS: { key: string; label: string; text: string; dot: string }[] = [
  { key: "blue", label: "Blue", text: "text-blue-600 dark:text-blue-400", dot: "bg-blue-500" },
  { key: "emerald", label: "Green", text: "text-emerald-600 dark:text-emerald-400", dot: "bg-emerald-500" },
  { key: "violet", label: "Violet", text: "text-violet-600 dark:text-violet-400", dot: "bg-violet-500" },
  { key: "rose", label: "Rose", text: "text-rose-600 dark:text-rose-400", dot: "bg-rose-500" },
  { key: "amber", label: "Amber", text: "text-amber-600 dark:text-amber-400", dot: "bg-amber-500" },
  { key: "teal", label: "Teal", text: "text-teal-600 dark:text-teal-400", dot: "bg-teal-500" },
  { key: "orange", label: "Orange", text: "text-orange-600 dark:text-orange-400", dot: "bg-orange-500" },
  { key: "pink", label: "Pink", text: "text-pink-600 dark:text-pink-400", dot: "bg-pink-500" },
  { key: "indigo", label: "Indigo", text: "text-indigo-600 dark:text-indigo-400", dot: "bg-indigo-500" },
];

export const MEMBER_COLOR_TEXT: Record<string, string> = Object.fromEntries(
  MEMBER_COLORS.map((c) => [c.key, c.text]),
);
export const MEMBER_COLOR_DOT: Record<string, string> = Object.fromEntries(
  MEMBER_COLORS.map((c) => [c.key, c.dot]),
);

export const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannually: "Every 6 months",
  annually: "Annually",
  "one-off": "One-off",
};

/** Short suffix appended to a price, e.g. "£30/mo". Empty for one-off. */
export const FREQUENCY_SUFFIX: Record<string, string> = {
  weekly: "/wk",
  monthly: "/mo",
  quarterly: "/qtr",
  biannually: "/6mo",
  annually: "/yr",
  "one-off": "",
};
