import {
  LayoutDashboard,
  Receipt,
  Home,
  PiggyBank,
  Hammer,
  ShoppingBag,
  Lightbulb,
  Wrench,
  FolderArchive,
  BarChart3,
  CalendarDays,
  History,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  title: string;
  href: string;
  icon: LucideIcon;
  description: string;
};

/** Primary navigation — drives both the desktop sidebar and mobile menu. */
export const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, description: "Your home command centre" },
  { title: "Bills & Expenses", href: "/bills", icon: Receipt, description: "Recurring household costs" },
  { title: "Mortgage", href: "/mortgage", icon: Home, description: "Balance, equity & payoff" },
  { title: "Savings Pots", href: "/savings", icon: PiggyBank, description: "Goals & contributions" },
  { title: "Projects & Tasks", href: "/projects", icon: Hammer, description: "Plan projects and track to-dos" },
  { title: "Future Purchases", href: "/purchases", icon: ShoppingBag, description: "Your home wishlist" },
  { title: "Inspiration", href: "/inspiration", icon: Lightbulb, description: "Ideas & link collections" },
  { title: "Maintenance", href: "/maintenance", icon: Wrench, description: "Reminders & servicing" },
  { title: "Documents", href: "/documents", icon: FolderArchive, description: "Warranties, insurance & more" },
  { title: "Calendar", href: "/calendar", icon: CalendarDays, description: "Key dates at a glance" },
  { title: "Analytics", href: "/analytics", icon: BarChart3, description: "Trends & breakdowns" },
  { title: "Change log", href: "/activity", icon: History, description: "Who changed what, and when" },
];

/** Tabs that can never be hidden from the sidebar. */
export const ALWAYS_VISIBLE = ["/dashboard"] as const;

// --- Option lists shared by forms (kept in sync with schema CHECK lists) -----

export const BILL_CATEGORIES = [
  "Mortgage", "Utilities", "Council Tax", "Broadband", "Mobile",
  "Insurance", "Subscriptions", "Maintenance", "Other",
] as const;

export const FREQUENCIES = ["weekly", "monthly", "quarterly", "annually", "one-off"] as const;

export const PRIORITIES = ["Low", "Medium", "High"] as const;

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

/**
 * Prefilled sub-category suggestions per category. These power a datalist on the
 * purchase form — users can pick one of these or type their own.
 */
export const PURCHASE_SUBCATEGORIES: Record<string, string[]> = {
  Furniture: [
    "Sofa", "Armchair", "Bed", "Mattress", "Wardrobe", "Chest of Drawers",
    "Bedside Table", "Dining Table", "Dining Chairs", "Coffee Table", "Desk",
    "Bookcase", "TV Unit", "Sideboard", "Shoe Cabinet",
  ],
  Appliances: [
    "Fridge", "Freezer", "Fridge Freezer", "Washing Machine", "Tumble Dryer",
    "Dishwasher", "Oven", "Hob", "Cooker Hood", "Microwave", "Kettle",
    "Toaster", "Coffee Machine", "Vacuum Cleaner",
  ],
  Technology: [
    "TV", "Soundbar", "Speaker", "Laptop", "Monitor", "Tablet", "Router",
    "Smart Hub", "Smart Speaker", "Security Camera", "Doorbell", "Games Console",
  ],
  Garden: [
    "Outdoor Sofa", "Garden Table", "Garden Chairs", "Parasol", "BBQ",
    "Pizza Oven", "Planters", "Shed", "Lawn Mower", "Decking", "Fencing",
    "Outdoor Lighting", "Hot Tub",
  ],
  Decor: [
    "Rug", "Curtains", "Blinds", "Cushions", "Throw", "Wall Art", "Mirror",
    "Table Lamp", "Floor Lamp", "Vase", "Houseplants", "Clock",
  ],
  Tools: [
    "Drill", "Saw", "Sander", "Ladder", "Toolbox", "Screwdriver Set",
    "Wrench Set", "Workbench", "Spirit Level", "Pressure Washer",
  ],
  Storage: [
    "Shelving", "Storage Boxes", "Wardrobe Organiser", "Cabinet", "Baskets",
    "Shoe Rack", "Coat Rack", "Under-bed Storage", "Drawer Dividers",
  ],
  Other: [],
};

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
  "Mortgage", "Insurance", "Warranties", "Manuals", "Quotes", "Certificates", "Receipts", "Other",
] as const;

export const ROOMS = [
  "Kitchen", "Living Room", "Bedroom", "Bathroom", "Garden", "Hallway",
  "Dining Room", "Office", "Garage", "Loft", "Exterior", "Whole House",
] as const;

/** Tailwind-friendly accent colours for savings pots. */
export const POT_COLORS = [
  "emerald", "sky", "violet", "amber", "rose", "teal", "indigo", "orange",
] as const;

export const FREQUENCY_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  quarterly: "Quarterly",
  biannually: "Every 6 months",
  annually: "Annually",
  "one-off": "One-off",
};
