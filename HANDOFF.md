# MyLife — Engineering Handoff

> **Purpose of this file:** a complete, self-contained briefing so another AI
> agent (or developer) can pick up exactly where work left off. Keep it updated
> after **every** change. Last updated: 2026-06-30 (Account/household management: change password, self-serve sign-up, household invite codes — shipped, not yet merged).

---

## Account & household management — COMPLETE, awaiting PR/merge (branch `claude/account-household-mgmt`)

User asked for three things after the module redesign (PR #97) was merged:
1. A settings page to change password.
2. A "create new user" interface on the landing page.
3. A way in settings to join or add someone to your household.

### Change password — DONE, no migration
- `settings/change-password.tsx`: re-authenticates with the current password via
  `supabase.auth.signInWithPassword` (this app's accounts are
  username→`@myhouse.local` email, so this re-auth is the only practical "are
  you sure" check available) before calling
  `supabase.auth.updateUser({ password })`. Wired into the existing Account
  card on `/settings`, above the Sign out button.
- Only meaningfully works for password-based accounts (the username/password
  flow), not Google-OAuth-only users — acceptable since password auth is this
  app's primary mechanism.

### Household invite/join — DONE — migration `0042_household_invites.sql` (already applied live via MCP)
- New table `household_invites` (household_id, code, created_by, expires_at
  — 7 days). RLS only lets you see/insert/delete invites you created.
- New `SECURITY DEFINER` function `public.redeem_household_invite(p_code)` —
  looks up the code (ignoring expired ones), then updates the caller's
  `household_members.household_id` to match. SECURITY DEFINER is required
  here (same pattern as the existing `same_household`/`is_household_member`
  helpers) because the joining user has no RLS visibility into a household
  they're not yet part of.
- `settings/actions.ts`: `createHouseholdInvite()` (requires the caller
  already has a `household_members` row — i.e. has set a display name —
  generates a 6-char code from an ambiguity-free alphabet, no 0/O/1/I),
  `joinHousehold(code)` (calls the RPC, surfaces a friendly error if the
  code's invalid/expired or the caller hasn't set a display name yet).
- `database.types.ts`: added `HouseholdInvite` type, registered
  `household_invites` in the Database map, and — new — populated the
  previously-empty `Functions` map with `redeem_household_invite` so
  `supabase.rpc(...)` typechecks (no other RPC call existed in the codebase
  before this).
- `settings/household-invite.tsx`: two-column UI in the existing Household
  card — "Invite someone" (generate + copy a code) and "Join a household"
  (paste a code + Join).

### Sign-up UI on the landing page — DONE, no migration
- `components/auth/sign-up.tsx`: name + username + password + confirm,
  reuses the existing `usernameToEmail()` mapping so created accounts are
  consistent with the existing `PasswordSignIn` flow. On success with a
  session, calls the existing `updateDisplayName` server action (imported
  from `settings/actions.ts` — same cross-route-group import pattern used
  elsewhere) so the new user's `household_members` row exists immediately,
  then redirects to `/dashboard`.
- **Open question for the user**: this project's existing 3 accounts
  (eashan/neelam/demo) all have `confirmed_at` set, but I can't tell from
  available tooling whether that's because "Confirm email" is OFF
  project-wide, or because each was manually ticked "Auto Confirm User" in
  the Supabase dashboard (the comment in `password-sign-in.tsx` suggests the
  latter — accounts were historically dashboard-created). If confirmation is
  required, `supabase.auth.signUp()` returns no session for a fresh
  `@myhouse.local` address (which can never receive a real confirmation
  email) and the account would be stuck. `sign-up.tsx` handles both cases:
  if a session comes back, it logs the user in immediately; if not, it shows
  an explanation telling them to ask an admin to confirm the account in
  Supabase, or to turn off "Confirm email" under Authentication → Providers
  → Email so self-serve signup works without an admin step. **I don't have a
  tool to read or change that GoTrue setting** — whoever picks this up
  should test signup once deployed and toggle it in the dashboard if needed.
- `components/auth/auth-tabs.tsx`: a "Sign in" / "Create account" toggle on
  `/login`, replacing the previously-static `PasswordSignIn` + `GoogleSignIn`
  block (now nested inside the "Sign in" tab).

Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean on
every batch (35 routes compile).

---

## MyLife module redesign — COMPLETE, merged to main (PR #97)

User asked for a deep redesign of 5 MyLife modules (habits, fitness, nutrition,
finance, health) plus a landing-page branding bug. Working through it as
separate verified, pushed batches. Tracking via the session's internal task
list (5 tasks: Habits, Workouts→plans, Nutrition→recipes, Finance pots,
Health reels/guides).

### Landing page branding fix — DONE
`src/app/login/page.tsx`, `src/app/layout.tsx` (root metadata), and
`src/app/manifest.ts` were hardcoded to "My House"/"MyLife" text instead of
switching on `NEXT_PUBLIC_APP` like the rest of the app shell. All three now
branch on `process.env.NEXT_PUBLIC_APP === "life"`. No DB change.

### Habits v2 — DONE — migration `0037_habits_v2.sql` (already applied live via MCP)
- `habits` gained `habit_type` ('yes_no' | 'numeric' | 'timer', default
  'yes_no'), `why` (text, the inspiration/motivation field), `unit` (text,
  for numeric habits e.g. "glasses").
- `habit_logs` gained `value` (numeric, for numeric-type logs) and
  `duration_seconds` (int, for timer-type logs). `count` is kept for
  backward compat but no longer carries meaning beyond "a log exists".
- New table `habit_targets` (habit_id, period, target_value) — a habit can
  have **one target per period**, periods are day/week/month/year/all_time/
  single (unique constraint on habit_id+period, so re-saving a period
  upserts it). `single` and `all_time` are computed identically (cumulative
  sum of all logs) — `single` is just framed as a one-shot goal in the UI.
- `src/lib/habit-progress.ts` (new, shared by page/dashboard/dialog):
  `logAmount(habit, log)` (1 for yes_no, `value` for numeric, minutes for
  timer), `getStreak(habit, logs)`, `sumForPeriod(habit, logs, period, today)`.
- `src/app/(app)/habits/actions.ts`: added `logHabitValue` (numeric upsert),
  `logHabitDuration` (timer upsert, `{add: true}` accumulates onto today's
  existing duration), `upsertHabitTarget`/`deleteHabitTarget`. Existing
  `logHabit`/`unlogHabit` (yes/no toggle) unchanged — still used by the
  dashboard quick-checkin widget.
- New `habit-calendar.tsx` (month-grid tracker, prev/next nav, filled cells
  = logged days, today gets a ring), `habit-timer.tsx` (start/pause/stop,
  mm:ss display, stop logs via `logHabitDuration` with `add:true`),
  `habit-detail-dialog.tsx` (why quote, type-appropriate quick-log control,
  target progress bars via `sumForPeriod`, the calendar, an Edit button that
  opens `HabitForm` nested inside — same nested-dialog pattern as
  `option-detail.tsx`).
- `habit-form.tsx`: added Type/Unit/Why fields; a `TargetsEditor` sub-section
  (only shown when editing an existing habit, since targets need a habit id)
  lets you set/replace/delete a target per period.
- `habits-view.tsx`: rows are now type-aware — yes_no keeps the tap-to-toggle
  circle; numeric/timer rows show today's logged amount and a chevron that
  opens `HabitDetailDialog` (where the actual numeric/timer logging happens).
  Tapping a habit's name always opens the detail dialog now (previously there
  was no per-habit edit entry point at all — `HabitForm` with a `habit` prop
  was unreferenced dead code).
- `habits/page.tsx`: now fetches **all** habit_logs (not just the last 30
  days) and `habit_targets`, since `all_time`/`single` targets and the
  calendar's month navigation need full history. "Best streak" and "This
  week" stat cards were previously hardcoded `—` — now computed for real via
  `habit-progress.ts`.
- `dashboard/daily-habits.tsx`: the dashboard quick-checkin widget now only
  shows `habit_type === "yes_no"` daily habits (numeric/timer habits need
  their dedicated logging UI, not a single tap-toggle).
- Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

### Fitness → workout plans — DONE — migration `0038_workout_plans.sql` (already applied live via MCP)
- Replaced per-session workout logging entirely with a reusable **exercise
  library + workout plan builder**. New tables: `exercises` (name,
  `muscle_groups text[]`, `technique`, `inspiration`, `pb_value`/`pb_unit`/
  `pb_date`), `workout_plans` (name, description, is_active), and
  `workout_plan_exercises` (join: plan_id, exercise_id, sets, reps,
  target_weight_kg, order_index, notes). The old `workouts`/
  `workout_exercises` tables are left in place but fully unused (nothing
  referenced them outside the fitness module — verified via grep before
  deleting `workout-form.tsx`).
- `src/lib/constants.ts`: `MUSCLE_GROUPS` (11 groups: Chest, Back,
  Shoulders, Biceps, Triceps, Forearms, Abs, Quads, Hamstrings, Glutes,
  Calves) and `PB_UNITS` (kg/lb/reps/seconds/minutes/km/m).
- `fitness/actions.ts` rewritten: `createExercise`/`updateExercise`/
  `deleteExercise` (now operate on the new `exercises` table — same
  function names as before but different table/shape, no other module
  imports them), `createWorkoutPlan`/`updateWorkoutPlan`/`deleteWorkoutPlan`,
  `addExerciseToPlan`/`updatePlanExercise`/`removeExerciseFromPlan`.
- `fitness/body-diagram.tsx`: a simplified front+back SVG human silhouette
  (geometric shapes, not anatomically precise) with one highlightable zone
  per `MUSCLE_GROUPS` entry — fills `fill-primary` when that muscle is
  worked. Used both per-plan (aggregated from its exercises) and at the
  bottom of the page (aggregated across the whole library).
- `fitness/exercise-form.tsx`: name, a toggle-pill multi-select for muscle
  groups, technique notes, inspiration, and an optional PB (value + unit +
  date, date only shown once a value is entered). Has an `onCreated`
  callback so it can be used both standalone and nested inside the plan
  picker (create-and-attach in one step).
- `fitness/plan-form.tsx`: name + description only (kept deliberately
  minimal — exercises are attached after creation via the detail dialog).
- `fitness/plan-detail-dialog.tsx`: shows the plan's exercises (sets/reps/
  weight, PB badge, muscle badges), the body diagram for just this plan's
  muscles, a "choose from library" select to attach an existing exercise, and
  a nested `ExerciseForm` to create-and-attach a brand new one. Same
  nested-dialog pattern as `habit-detail-dialog.tsx`/`option-detail.tsx`.
- `fitness/fitness-view.tsx` (client) + `fitness/page.tsx` (server): Plans
  grid (tap a card to open `PlanDetailDialog`), an Exercise library grid
  (tap a card to open `ExerciseForm` pre-filled for editing — same
  previously-dead-code-now-wired pattern as the habits edit fix), and a
  library-wide body diagram at the bottom.
- Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

### Nutrition → recipes — DONE — migration `0039_recipes.sql` (already applied live via MCP)
- Replaced meal logging with recipe capture. New tables: `recipes` (name,
  `video_url`, `image_url`, `servings`, `calories`/`protein_g`/`carbs_g`/
  `fat_g` — nutritional value per recipe, `notes` for method/steps) and
  `recipe_ingredients` (recipe_id, `name`, `quantity` as free text e.g. "2
  cups" or "a pinch" — deliberately not split into numeric+unit, ingredient
  quantities are too irregular for that, `order_index`). Old
  `nutrition_logs` table left in place but unused (confirmed via grep: not
  referenced by the dashboard or anywhere else).
- `nutrition/actions.ts` rewritten: `createRecipe`/`updateRecipe` accept the
  recipe fields plus an `ingredients[]` array and write both tables in one
  call (update replaces all ingredient rows — delete-then-reinsert, simplest
  correct approach for a small reorderable list), `deleteRecipe`.
- `nutrition/recipe-form.tsx`: name, `ImageUpload` photo (same component
  used by projects/photos), video link (plain URL field — no embed
  fetching/oEmbed, just a "watch the video" link out), a dynamic
  add/remove ingredients list (name + free-text quantity per row),
  servings, the 4 macro fields, and a method/notes textarea.
- `nutrition/recipe-detail-dialog.tsx`: photo, video link, a 4-stat macro
  strip, ingredients list, method, and a nested Edit button (same pattern
  as habits/fitness).
- `nutrition/nutrition-view.tsx` + `nutrition/page.tsx`: a recipe card grid
  (photo or a ChefHat placeholder, calories, ingredient count, a film icon
  if it has a video) — tapping a card opens the detail dialog.
- Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

### Finance: savings & investment pots — DONE — migration `0040_pot_type.sql` (already applied live via MCP)
- Reused the existing `savings_pots` infrastructure (household-shared
  table, accounts + contributions ledger from migration 0007, the
  `QuickContribute` quick-add-value dialog) rather than building anything
  new — added a single `pot_type` column ('savings' | 'investment',
  default 'savings').
- `src/lib/constants.ts`: `POT_TYPES`, `POT_TYPE_LABELS`.
- `src/lib/schemas.ts`: `savingsPotSchema` gained `pot_type` (enum, default
  'savings'); `savings/actions.ts#toRow` persists it.
- `savings/pot-form.tsx`: a Pot type select, plus a new `defaultPotType`
  prop so a "New pot" trigger can pre-select Investment.
- `/savings` page now groups pots into a "Savings pots" section and an
  "Investment pots" section (only rendered when non-empty), each still
  using the existing `PotCard` grid.
- `/finance` page: replaced the single read-only "Savings pots" summary
  with two full `Card`s — **Savings pots** and **Investment pots** — each
  rendering up to 4 `PotCard`s (imported from
  `@/app/(app)/savings/pot-card`, same cross-route-group import pattern
  already used by `dashboard/daily-habits.tsx`), so the existing
  `QuickContribute` "Add" button is right there on `/finance` for fast
  value/contribution entry on any pot, plus a "New pot" trigger pre-set to
  the right type. `totalSaved`/`totalTarget` stats are now scoped to
  savings-type pots only; the top "Savings rate" stat card still sums
  monthly contributions across both types (a deliberate "money being put
  away" metric).
- Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

### Health: reels & guides — DONE — migration `0041_health_inspiration.sql` (already applied live via MCP)
- Additive (unlike the other 4 modules — health keeps all its existing
  records/medications/appointments functionality, this just adds a new
  section). New table `health_inspiration`: `kind` ('reel' | 'guide'),
  `title`, `url` (video link for reels, optional link for guides),
  `image_url`, `source` (e.g. "Instagram", "a friend"), `content` (notes
  for a reel, the body for a guide).
- `src/lib/constants.ts`: `HEALTH_INSPIRATION_KINDS`,
  `HEALTH_INSPIRATION_KIND_LABELS`.
- `health/actions.ts`: `createHealthInspiration`/`updateHealthInspiration`/
  `deleteHealthInspiration` appended to the existing file.
- `health/health-inspiration-form.tsx`: kind select (changes labels/hints
  contextually — "Video link" for reels vs an optional link for guides,
  "Guide content" vs "Notes" for the textarea), title, `ImageUpload` cover
  photo, source, content. Added to `HealthAddMenu` alongside the existing
  record/medication/appointment triggers.
- `health/health-inspiration-list.tsx`: a card grid (cover photo or a
  Film/BookOpen placeholder icon by kind) — tapping a card opens the form
  pre-filled for editing.
- `health/page.tsx`: new "Inspiration & guides" section (its own Add
  button + empty state), `hasData` now also considers inspiration items so
  the page's empty state only shows when there's truly nothing.
- Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

### Branch status
All 5 module redesigns shipped via PR #97, merged to `main`, and confirmed
live in production on both Vercel projects (`my-house-dashboard` and
`my-life-dashboard`) off the merge commit. Migrations 0037–0041 were applied
live on the Supabase project via MCP — nothing further to run.

Smaller pre-existing gaps not part of this redesign (still open):
- Journal entries: past entries show non-clickable rows; `JournalForm` isn't
  wired into the entry list for editing.
- Goals: cards have no per-card edit button.

---

## MyHouse / MyLife app split — COMPLETE (merged to main, PR #95)

**What shipped:**
- Single codebase, single Supabase database, **two Vercel deployments** distinguished
  by one build-time env var: `NEXT_PUBLIC_APP=house` (existing `my-house-dashboard`
  project, default when unset) vs `NEXT_PUBLIC_APP=life` (new MyLife project, not yet
  created in Vercel — see below).
- `src/lib/constants.ts`: replaced the single flat `NAV_ITEMS`/`NAV_GROUPS` with two
  full sets — `HOUSE_NAV_GROUPS`/`HOUSE_NAV_ITEMS` (household-focused: Bills, Mortgage,
  Savings, Projects, Rooms, Inspiration, etc.) and `LIFE_NAV_GROUPS`/`LIFE_NAV_ITEMS`
  (personal OS: Habits, Journal, Fitness, Nutrition, Health, Finance, Goals, Tasks).
  A `_isLife = process.env.NEXT_PUBLIC_APP === "life"` switch picks which set is
  exported as `NAV_ITEMS`/`NAV_GROUPS` (same names, so every existing import site is
  unaffected).
- `src/hooks/use-bottom-tabs.ts`: `DEFAULT_BOTTOM_TABS` now branches the same way
  (`["/dashboard","/habits","/fitness","/journal"]` for life vs
  `["/dashboard","/projects","/bills","/rooms"]` for house).
- `src/app/(app)/layout.tsx` + `src/components/layout/mobile-nav.tsx`: branding
  ("My House" vs "MyLife") and the footer tagline now read from the same env var
  instead of being hardcoded.
- Both apps share the same Supabase URL/anon key, so tasks/bills/calendar created in
  one are visible in the other — only nav and branding differ.
- No DB migration for this batch (pure nav/branding).

**Verification:** `npm run typecheck`, `npm run lint`, `npm run build` all clean
(35 routes compiled).

**Merge history note:** PR #95 was originally opened on top of the 3 separate
MyLife milestone commits, but `main` had since absorbed those as one squashed commit
(`445ea2d`, from PR #94), causing a real merge conflict. Fixed by resetting the
feature branch to `origin/main` and cherry-picking just the app-split commit on top
(no conflicts — it touches the same files as the squash but the squash already
contains that content). Force-pushed, status checks passed, merged via squash.

**Still TODO (needs the user, outside this codebase):**
- Create the second Vercel project: Add New Project → import
  `eashankaradia/My-House-Dashboard` → set `NEXT_PUBLIC_APP=life` → copy across the
  existing Supabase env vars (URL + anon key) → Deploy. The existing
  `my-house-dashboard` project needs no changes (unset env var defaults to house).

---

## MyLife Milestone 3: Finance — COMPLETE

**What shipped:**
- **New `/finance` page** — Personal financial overview hub with:
  - 4 stat cards: Monthly income, Monthly bills, Net monthly (income − bills), Savings rate
  - Budget vs actual: per-category comparison with progress bars and Over/Near badges
  - Savings pots overview: total saved, target, monthly contributions + per-pot progress bars
  - Financial goals: active goals with `category === "Financial"` + progress
  - Quick links to Bills, Savings, Analytics
  - `finance/loading.tsx` skeleton screen
- **Income tracking** — `finance_settings` table (one row per user). `IncomeForm` dialog to set/edit monthly take-home income + label.
- **Budget management** — `budgets` table (one row per user per category, unique constraint). `BudgetForm` dialog to add/edit/delete monthly budget limits per category. `BUDGET_CATEGORIES` constant extends `BILL_CATEGORIES` with personal spending categories (Food & Groceries, Transport, Eating Out, Entertainment, Clothing, Personal Care, Healthcare).
- **Server actions** — `finance/actions.ts`: `upsertFinanceSettings`, `upsertBudget`, `deleteBudget`.
- **Nav item** — `/finance` added at top of Finances group with `Wallet` icon.
- **Dashboard cash flow widget** — `cashFlow` widget (id registered in `DASHBOARD_WIDGETS`). Only renders when income is set. Shows income / bills / net monthly / savings rate in a compact 4-column grid inside a `CollapsibleSection` linking to `/finance`.
- **Types** — `FinanceSettings` and `Budget` types added to `database.types.ts` + Database Tables map.

**Verification:** `npm run build` ✓ clean (all 36 routes compiled).

**DB migration — run this in Supabase SQL editor:**

```sql
-- 0036_finance_budgets.sql
create table if not exists finance_settings (
  id             uuid         primary key default gen_random_uuid(),
  user_id        uuid         not null unique references auth.users(id) on delete cascade,
  monthly_income numeric(12, 2),
  income_label   text         not null default 'Monthly income',
  updated_at     timestamptz  not null default now()
);
alter table finance_settings enable row level security;
create policy "Users manage own finance settings" on finance_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists budgets (
  id            uuid         primary key default gen_random_uuid(),
  user_id       uuid         not null references auth.users(id) on delete cascade,
  category      text         not null,
  monthly_limit numeric(12, 2) not null default 0,
  notes         text,
  created_at    timestamptz  not null default now(),
  updated_at    timestamptz  not null default now(),
  unique (user_id, category)
);
alter table budgets enable row level security;
create policy "Users manage own budgets" on budgets
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create trigger set_finance_settings_updated_at
  before update on finance_settings
  for each row execute function set_updated_at();
create trigger set_budgets_updated_at
  before update on budgets
  for each row execute function set_updated_at();
```

**Next milestone (Milestone 4):** Per the roadmap this would be Fitness (enhanced workout tracking, exercise library, progress charts) or Health (health records dashboard, medication reminders, appointment timeline). Alternatively: wire journal entries to be clickable/editable from the list (currently read-only), or add edit buttons to goal cards.

---

## MyLife Milestone 2: Core Platform — COMPLETE

**What shipped:**
- **Form dialogs** wired up for all 6 new modules — every "Add" button now opens a working form:
  - `habits/habit-form.tsx` — create/edit habits (name, description, frequency, colour, delete)
  - `goals/goal-form.tsx` — create/edit goals (title, description, category, target/current value, unit, target date, status when editing, delete)
  - `journal/journal-form.tsx` — write/edit journal entries (date, mood picker with emoji, content, gratitude; upserts so one entry per day)
  - `fitness/workout-form.tsx` — log/edit workouts (name, type, date, duration, notes, delete)
  - `health/health-forms.tsx` — three separate forms: `LogHealthRecordForm` (type, value/value2 for BP, unit), `AddMedicationForm` (name, dosage, frequency, start date), `AddAppointmentForm` (title, provider, date, time, location); `HealthAddMenu` combines all three in the page header
  - `nutrition/meal-form.tsx` — log a meal (name, type, date, calories, protein, carbs, fat)
- **All module pages updated** to replace static `<Button>` placeholders with the real form dialog components (habits, goals, journal, fitness, health, nutrition pages all updated).
- **Loading skeletons** added for all 6 new modules: `habits/loading.tsx`, `goals/loading.tsx`, `journal/loading.tsx`, `fitness/loading.tsx`, `health/loading.tsx`, `nutrition/loading.tsx`.
- **Dashboard redesign** — MyLife daily briefing added:
  - Subtitle under greeting now shows life score: "X of Y habits done today · N%"
  - New `dashboard/daily-habits.tsx` — client component for interactive habit check-in on the dashboard (tap to complete/un-complete daily habits, with streak badges, optimistic updates)
  - New "Today's habits" dashboard widget (`habitCheckIn`) — compact collapsible with `DailyHabits` component
  - New "Goals progress" dashboard widget (`goalsProgress`) — compact collapsible with active goals, progress bars, category badges
  - Both new widgets added to `DASHBOARD_WIDGETS` in `dashboard-customize.tsx` (visible by default, user can toggle off)
  - Dashboard fetches habits + habit_logs (last 30 days) + active goals in the existing `Promise.all`

**Verification:** `npm run build` ✓ clean (all 34 routes compiled).

**No new DB migrations** — all form components call the server actions from Milestone 1. Migration 0035 (from Milestone 1) must still be run live for the forms to actually save data.

**Next milestone (Milestone 3):** Per the roadmap this would be Finance (bill intelligence, spending analysis, savings automation). Alternatively, the journal entries list currently shows non-clickable buttons — wiring `JournalForm` into the existing journal entry rows (edit flow) would be a quick win. Goals page could also show edit buttons on each card.

---

## MyLife Milestone 1: Foundation — COMPLETE

**What shipped:**
- **Rebrand**: App renamed from "My House Dashboard" → "MyLife" throughout (metadata, sidebar, topbar, footer, manifest).
- **Dark mode default**: `defaultTheme="dark"` in providers (users can still toggle).
- **Design system**: Updated CSS custom properties — deep neutral dark mode (premium feel, not navy-tinted), `info` semantic color added, `--radius` updated. `tailwind.config.ts` now has `info` color + richer animation keyframes (`fade-in-scale`, `slide-up`, `number-in`, `shimmer`). Typography scale CSS classes added (`.text-display`, `.text-heading`, `.text-title`, `.text-body`, `.text-caption`, `.skeleton`).
- **Navigation restructure**: `NAV_GROUPS` changed from `["Overview","Money","Planning","Home","Capture","Calendar"]` → `["Home","Finances","Health","Planner","More"]`. All 23 nav items reorganised. New icons: Dumbbell, Heart, Utensils, Repeat, Target, BookOpen. Default bottom tabs updated to `["/dashboard", "/bills", "/fitness", "/habits"]`. Sidebar now shows group headings for all 5 groups.
- **6 new module pages** (all build, all have proper empty states + stat cards):
  - `/fitness` — workout log, exercise sets, monthly stats
  - `/health` — health records, medications, appointments
  - `/habits` — daily/weekly/monthly habit tracker with streak + optimistic toggle
  - `/goals` — goal cards with progress bars, category colours
  - `/journal` — daily reflections with mood emoji, entry list
  - `/nutrition` — meal logging, macro tracking, daily targets
- **Server actions** for all 6 modules: `habits/actions.ts`, `goals/actions.ts`, `journal/actions.ts`, `fitness/actions.ts`, `health/actions.ts`, `nutrition/actions.ts`.
- **Migration `0035_mylife_foundation.sql`** — **RUN THIS LIVE** in Supabase SQL editor. Adds:
  - `habits` + `habit_logs` (personal RLS: `auth.uid() = user_id`)
  - `goals`
  - `journal_entries` (unique per user per date)
  - `workouts` + `workout_exercises`
  - `health_records`, `medications`, `appointments`
  - `nutrition_logs`
  - All tables have indexes + `updated_at` triggers (reuses existing `set_updated_at()` function).
- **`database.types.ts`** updated with 10 new type exports + all new tables registered in the `Database` map.
- **`constants.ts`** extended with `HABIT_FREQUENCIES`, `HABIT_COLORS`, `GOAL_CATEGORIES`, `GOAL_STATUSES`, `WORKOUT_TYPES`, `HEALTH_RECORD_TYPES`, `HEALTH_RECORD_LABELS`, `APPOINTMENT_STATUSES`, `MEAL_TYPES`, `MOOD_OPTIONS`.

**Verification:** `npm run build` ✓ clean (all 29 routes compiled).

**Next milestone (Milestone 2: Core Platform):** Dashboard redesign to the MyLife daily briefing — personalised greeting, life score, "Needs attention", quick habit check-in, goals progress ring, and a morning briefing card. Also: form dialogs for all 6 new modules (currently pages show empty states or read-only views with no forms wired up yet).

---

### Notes & Links (done) — **needs migration 0034**
- `0034_useful_links.sql` adds `useful_links` (title, url, description) + household
  RLS + updated_at trigger. **RUN THIS LIVE** (SQL given inline).
- **Separated notes from documents.** New `/notes` route ("Notes & Links") shows
  Notes (the existing `documents` rows with `category="Note"`) + a new **Useful
  links** list. The `/documents` page now shows documents only (queries
  `neq category 'Note'`), renamed to just "Documents".
- New: `notes/page.tsx`, `notes/actions.ts` (create/update/deleteUsefulLink),
  `notes/useful-link-form.tsx`. Notes still reuse `documents/note-form.tsx` +
  `deleteDocument` (which now also `revalidatePath("/notes")`).
- Types/schema: `UsefulLink` type + `useful_links` registered in `Database`;
  `usefulLinkSchema` in schemas.
- Nav: `/documents` renamed "Documents"; new "Notes & Links" (`NotebookPen`,
  group Home). Quick-add menu gains **Note** and **Link** pills (Capture group).
- Verified: typecheck, lint, build clean.

### Brand logo (done, no DB)
- Replaced the generic lucide `Home` icon mark with the new house/"M" logo
  (`public/icons/logo.png`, 1254²). Used in the app sidebar + mobile top bar
  (`(app)/layout.tsx`) and the login card, sized in a square with `object-contain`
  so it's centred with the asset's built-in padding.
- Favicon via `src/app/icon.png` (Next.js convention); PWA `manifest.ts` icons now
  point at `/icons/icon.png` (512², purpose any + maskable). Old `icon.svg` left in
  place but unreferenced.

## -2. FOURTH LIST in progress (Claude, 2026-06-27)

User's latest request list, shipped as small PR-per-batch. SQL is always pasted
inline in chat for the user to run (user runs all SQL themselves).

Requests:
1. Bills: add a start date — **DONE batch 2** (migration 0030).
2. Remove the "point out to a member" (PointOutButton) feature — **DONE batch 3** (no DB).
3. Click into a purchase option to see its details (read-only) — **DONE batch 1**.
4. Fix the rating system (too sensitive / not sticky) — **DONE batch 1**.
5. Remove ratings from top-level purchase items — **DONE batch 6** (no DB).
6. Categorise purchases as a big or small purchase — **DONE batch 4** (migration 0031).
7. Let people react to individual comments — **DONE batch 5** (no DB).
8. Truncate long option names so they don't widen the card — **DONE batch 1**.
9. Furniture options: pick shape + dimensions, then use them in the Room Designer —
   **DONE** (capture batch 1, Room Designer wiring batch 7).

### Batch 1 (done) — option shape/dimensions + detail + sticky rating — **needs migration 0029**
- `0029_option_dimensions.sql` adds `purchase_options.shape` (text) +
  `width_cm`/`depth_cm`/`height_cm` (numeric). **RUN THIS LIVE** (SQL given inline).
- **Shape + dimensions capture (#9, part 1):** `option-form.tsx` "More details"
  section gains a "Size & shape" block — shape `NativeSelect`
  (Rectangle/Square/Round, `OPTION_SHAPES`/`OPTION_SHAPE_LABELS` in constants) and
  W/D/H cm number inputs. Schema (`purchaseOptionSchema`) + `addOption`/`updateOption`
  persist them; `PurchaseOption` type extended. (Room Designer placement still TODO.)
- **Click into an option for details (#3):** new `option-detail.tsx`
  (`OptionDetailDialog`) — read-only view (image, price + price-change, rating,
  store, shape, size, notes, link, Edit button). `option-row.tsx` image + name
  now open it.
- **Sticky / less-sensitive rating (#4):** `star-rating.tsx` rewritten — tapping a
  star always *sets* that value (no clear-on-reclick), bigger touch targets, no
  hover preview; a separate `×` clears. Read-only when no `onRate`.
- **Truncate option names (#8):** `option-row.tsx` row is `w-full min-w-0`; name
  is a truncating trigger button inside `min-w-0 flex-1` so long names no longer
  widen the card.
- Verified: `npm run typecheck`, `npm run lint`, `npm run build` all clean.

### Batch 2 (done) — Bills start date (#1) — **needs migration 0030**
- `0030_bill_start_date.sql` adds `bills.start_date date`. **RUN THIS LIVE.**
- `start_date` added to `billSchema` (optionalDate), `Bill` type, `toRow` in
  bills `actions.ts`, the bill form (new "Start date (optional)" field paired with
  End date), and `bill-detail.tsx` (shown only when set).
- Verified: typecheck, lint, build all clean.

### Batch 3 (done, no DB) — remove PointOutButton (#2)
- Deleted `components/shared/point-out-button.tsx` and removed its import + usage
  from all 7 detail dialogs (inspiration, bills, purchases, projects, maintenance,
  savings pot, documents). Verified no references remain; typecheck/lint/build clean.
- `sendNotification`/`listOtherMembers` in `notifications/actions.ts` are left in
  place (harmless if otherwise unused).

### Batch 4 (done) — big/small purchase category (#6) — **needs migration 0031**
- `0031_purchase_size.sql` adds `purchases.size text` (null = unspecified).
  **RUN THIS LIVE.**
- `PURCHASE_SIZES = ["Small","Big"]` in constants; `size` added to `Purchase`
  type, `purchaseSchema` (enum, "" → undefined), and `toRow` in purchases actions.
- Purchase form: new "Size" select paired with Category ("Small/Big purchase").
- Detail dialog shows the size; grid gains an "Any size / Small / Big" filter.
- NOTE: zod input-vs-output — the form default must be `undefined` (not `""`)
  for `size`, else TS2322. (Pattern to remember for enum-with-empty fields.)

### Batch 5 (done, no DB) — react to individual comments (#7)
- Reuses the polymorphic `reactions` table with `entity_type="comment"`,
  `entity_id=comment.id` — no migration (existing RLS/insert path accepts it).
- `comments/actions.ts#loadThread` now fetches comment-level reactions in one
  `.in("entity_id", commentIds)` query and attaches `reactions[]` to each
  `CommentView`. `deleteComment` also clears that comment's reactions (no FK
  cascade on the polymorphic table).
- `item-comments.tsx`: each comment row shows its reaction pills + a SmilePlus
  quick-react picker (`reactToComment` → `toggleReaction("comment", id, emoji)`).
- Verified: typecheck, lint, build all clean.

### Batch 6 (done, no DB) — remove top-level item ratings (#5)
- Item ratings were already un-settable (no form field, `setPurchaseRating` had
  no callers). This batch finishes the cleanup so ratings live on options only:
  - `effectiveRating` is now option-only (no `p.rating` fallback); an item's score
    is its best option's rating, else 0.
  - Removed the dead `setPurchaseRating` action.
  - Removed `rating` from `purchaseSchema` and the purchases `toRow`.
- `purchases.rating` column + `Purchase.rating` type left in place (legacy,
  harmless; nothing reads it now). Verified: typecheck, lint, build clean.

### Batch 7 (done) — option dimensions in the Room Designer (#9 part 2) — **needs migration 0032**
- `0032_layout_item_shape.sql` adds `room_design_layout_items.shape` (text) +
  `option_id` (uuid). **RUN THIS LIVE.**
- `RoomLayoutItem` type gains `shape` + `option_id`. `addLayoutItem` now accepts
  `shape`/`purchase_id`/`option_id`; `LAYOUT_FIELDS` + `duplicateDesignVersion`
  carry them.
- Design page (`rooms/[id]/design/[versionId]/page.tsx`) loads purchase options
  that have a footprint (`width_cm`+`depth_cm` not null) and their parent purchase
  names, passing them to `FloorPlanner` as `wishlist: WishlistOption[]`.
- Floor planner: new **"From wishlist"** picker (`AddFromWishlist`) lists those
  options (image, name, purchase, size, shape); picking one drops a layout item to
  scale via `addLayoutItem`, linked by `purchase_id`/`option_id` (so the selected-
  item panel's "Linked purchase" link works). Round options render as an
  `<ellipse>`; a Shape selector (Rectangle/Square/Round) was added to the
  selected-item editor so any piece can be reshaped.
- Verified: typecheck, lint, build all clean.

### Batch 8 (done, no DB) — option name overflow on mobile (follow-up)
- Opening an item's options on a narrow phone scrolled sideways: the option name
  `truncate` span sat in a nested flex without `min-w-0`, so it kept full intrinsic
  width and overflowed instead of ellipsing. Fixed in `option-row.tsx`: name span
  is now `min-w-0 flex-1 truncate`, inner flex is `min-w-0`, Picked badge is
  `shrink-0`, button is `w-full min-w-0`. Also hid the "Edit" label on mobile
  (`hidden sm:inline`, icon kept) to free width. Typecheck/lint/build clean.

### Mobile UX Tier 3 (done, no DB) — polish
- **Sticky section headers** on Documents: each category group is a `<section>`
  with a `sticky top-16` backdrop-blurred header + count (iOS grouped-list feel),
  replacing the per-category Cards.
- Overscroll containment came in Tier 1 (dialogs); internal scroll lists inherit it.
- Verified: typecheck, lint, build clean. **Mobile UX Tiers 1–3 all shipped.**

### Mobile UX Tier 2 (done, no DB) — consistency & layout
- **Tables → cards on mobile**: new `useIsMobile()` hook (SSR-safe matchMedia).
  Tasks and Purchases force the stacked/card view under `sm` regardless of the saved
  view pref, and hide the Table-view toggle on mobile. (Projects kanban left as-is —
  horizontal column scroll is an accepted mobile pattern.)
- **Compact mobile page headers**: `PageHeader` title `text-xl sm:text-2xl`; the
  description is hidden on mobile only when an info hint carries the explanation.
- Verified: typecheck, lint, build clean. NEXT: Tier 3 (sticky group headers, scroll polish).

### Batch 12 (done, no DB) — Mobile UX Tier 1 (native-feel fundamentals)
- **16px inputs on mobile** (Input/Textarea/NativeSelect now `text-base sm:text-sm`,
  inputs/selects `h-11 sm:h-10`) — stops iOS Safari auto-zooming on focus.
- **Safe-area insets**: bottom nav `pb-[env(safe-area-inset-bottom)]`; main content
  `pb-[calc(6rem+env(safe-area-inset-bottom))]`; mobile dialog sheet + sticky footer
  padded for the home indicator.
- **Dialog uses `dvh`** (90dvh/92dvh) + `overscroll-contain` so sheets don't jump
  with the URL bar or drag the page.
- **Press feedback**: `active:scale` on Button (global), bottom-nav tabs + FAB.
- **Touch targets + touch-reachability**: option-row action/chevron buttons and
  comment react/delete buttons enlarged to ~36–40px with active states. Fixed
  hover-only reveals that were unreachable on touch (comment actions, colour-studio
  swatch remove) → visible on mobile, hover-reveal on `sm+`.
- Verified: typecheck, lint, build all clean. NEXT: Tier 2 (tables→cards on mobile,
  filter sheets across list pages, compact mobile headers), then Tier 3 (sticky
  group headers, overscroll polish).

### Batch 11 (done, no DB) — Documents: drop row category badge + more categories
- The per-document **category badge is removed from `document-row.tsx`** (the page
  already groups documents into per-category section cards, so it was redundant).
- **More document categories**: `DOCUMENT_CATEGORIES` (constants) gained Tax,
  Utilities, Contracts, Legal, Vehicle, Medical, Identity, Banking, Appliances,
  Garden, Pets, Travel (Note/Other kept last). The matching `DocumentCategory`
  union in `database.types.ts` was extended to match (it's a hand-maintained
  union, separate from the constant — keep them in sync). No DB change (category
  is a text column; the form already lists `DOCUMENT_CATEGORIES` minus "Note").
- Verified: typecheck, lint, build all clean.

### Batch 10 (done, no DB) — Room Designer: doors on the plan + distances
- **Doors are now placed/dragged on the floor plan** (`floor-planner.tsx`), not just
  via the number-input form: a "Door" toolbar button drops a door on the bottom wall;
  doors render as a white wall-gap + a sky swing arc + leaf + jamb dots; drag a door
  along its wall to position it; selecting one opens a panel (Wall select, Width,
  delete). Persisted to `room.doors` via `updateRoomDetails` (already whitelisted).
  Door geometry/swing in `doorGeom` (inward normal per wall; SVG arc sweep =
  sign of `t × n`). The old `RoomShapeDoors` form on the room overview still works.
- **Distances toggle** (Ruler button, `showDims`): overlays each room wall's length
  (per outline edge, label nudged inward toward the centroid) and, for the selected
  furniture item, dashed measure lines + labels for its gap to each wall. Helpers
  `fmtDist` (m/cm) and `DimLabel` (translucent backing). No DB.
- Verified: typecheck, lint, build all clean.

### Batch 9 (done, no DB) — notifications + options UX follow-ups
- **Removed "Push to someone"** (notifications page): dropped the manual send-note
  form from `notification-controls.tsx` (now just the list); `sendNotification`
  action kept for internal use.
- **Comments on options**: `OptionDetailDialog` now renders `ItemComments`
  (`entityType="purchase_option"`, `entityId=option.id`) — reactions + threaded
  comments per option, same as items.
- **Option row no longer overflows on mobile**: `option-row.tsx` redesigned into
  two lines (rank·image·name/meta·price, then rating·actions) with `overflow-hidden`
  + robust `min-w-0`/`truncate`; actions are icon-only; timestamps moved to the
  detail view.
- **Slimmer option form**: "More details" reorganised (Link, Photo, Rating, then
  Store + price-frequency in a 2-col row, Notes); the furniture-only Size & shape
  block is now behind its own nested toggle (`showSize`).
- Verified: typecheck, lint, build all clean.

### Batch 11 (done, no DB) — purchases/inspiration polish follow-up
- **Purchases long text no longer widens cards:** `purchases-grid.tsx` purchase
  cards now force `min-w-0`/`max-w-full`/`overflow-hidden`; purchase names and
  notes wrap with `overflow-wrap:anywhere` so very long appliance/item names or
  descriptions stay inside the card instead of causing sideways scrolling.
- **Purchase option rows wrap safely too:** `option-row.tsx` changed option
  names/meta from single-line truncation to wrapping with `overflow-wrap:anywhere`,
  while preserving the image/rank/price/actions layout.
- **Items with no options are de-prioritised:** purchases with one or more options
  always sort above purchases with zero options, regardless of the selected sort.
  Added a "Hide items with no options" toggle in the purchases filter bar.
- **Inspiration can filter by creator:** `inspiration/page.tsx` now passes
  `memberMap`; `inspiration-hub.tsx` adds an "Added by anyone/member" filter.
- **Seen inspiration reels can collapse:** feed view has a "Seen reels collapsed"
  toggle. Items already marked seen (via existing `comment_reads`) show a compact
  placeholder instead of loading the embed, with a one-click "show it again" reveal.
- Verified: `npm.cmd run typecheck` and `npm.cmd run lint` clean. No migration.

### Batch 12 (done, no DB) — inspiration reels UI follow-up
- **Collapsed seen reels are now single-line:** `inspiration-hub.tsx` replaced the
  large dashed explainer placeholder with a slim 36px pill row containing the item
  title and a right-side expand chevron.
- **Expanded seen reels can be tucked away again:** when a seen reel is manually
  expanded, it shows a small icon-only collapse chevron above the media.
- **Collections are collapsible:** new `collections-strip.tsx` replaces the always-
  visible collection chips on `inspiration/page.tsx` with a compact "Collections"
  row showing collection count + saved idea count; expanding reveals the chips and
  delete controls.
- **Feed feels more like reels:** feed column narrowed to a phone-like reel width,
  cards are rounder with less padding/chrome, notes clamp to three lines, and
  `social-embed.tsx` uses a taller 9:14 reel aspect with black media framing.
- No migration.

### Batch 13 (done, no DB) — reel-card collapse, recent updates, room designer
- **Whole seen reel cards collapse:** `inspiration-hub.tsx` now collapses the
  entire seen feed card into a slim one-line pill with source initials, title and
  a right-side expand chevron. Expanding restores the full card; the full card
  keeps the icon-only collapse chevron.
- **Recent updates are collapsed everywhere:** `SectionActivityLog` now renders
  through new client component `activity-log-card.tsx`; every section log is
  collapsed by default and shows a badge count in the header.
- **Recent updates show two max when expanded:** `SectionActivityLog` slices the
  loaded activity to the two newest entries when open, keeping per-tab bottoms
  tidy.
- **Room Designer door flipping:** `RoomDoor` gained optional `flipped` (stored
  inside existing `rooms.doors` JSON, no migration). `floor-planner.tsx` swaps
  the hinge/latch geometry when flipped and adds a selected-door "Flip" button;
  `room-shape-doors.tsx` exposes the same flip icon in the overview door list.
- **Room Designer is more self-explanatory:** planner now shows a short guidance
  strip explaining drag/select/distances when not editing the room outline.
- **Distances apply to all furniture:** distance mode now shows each layout
  item's nearest horizontal and vertical wall gaps, instead of only measuring
  the selected item.
- Verified: `npm.cmd run typecheck`, `npm.cmd run lint`, and `npm.cmd run build`
  clean. No migration.

**FOURTH LIST COMPLETE** — all 9 requests shipped. Migrations the user still needs
to run live: 0029 (option dims), 0030 (bill start_date), 0031 (purchase size),
0032 (layout item shape/option_id). Each was provided inline in chat.

## -1. THIRD LIST in progress (Claude, 2026-06-26)

User submitted a third list of ~19 requests. Working through in batches.

### Batch K (done, no DB): quick wins
- **Activity by household shows others, not me** (#1): `SectionActivityLog` now
  takes `excludeSelf` (filters `user_id != me`); dashboard widget passes it.
- **Short bottom-tab titles** (#3): `NavItem.short` added in `constants.ts`
  (Home/Bills/Savings/Projects/Purchases/Upkeep/Docs/Log); `bottom-nav.tsx`
  uses `item.short ?? item.title`.
- **Search everything incl. settings + pages** (#4): `search/actions.ts` now
  appends `pageMatches()` — NAV_ITEMS + Settings sections — as `type: "Page"`.
- **Mini calendar expands inline** (#6): `week-ahead.tsx` is now a client
  component; tapping a day toggles an inline list of that day's items (bills,
  tasks, maintenance, docs, project/savings targets, events). Dashboard builds
  per-day `items[]` (label/sub/href) instead of just a count.
- **Activity option-vs-item distinction** (#10): `ENTITY_TAG` in
  `activity-meta.ts` (Item=sky, Option=violet badge); shown in both
  `activity-list.tsx` and `section-activity-log.tsx`.

### Batch L (done) — Purchases revamp — **needs migration 0016**
- `0016_purchase_ratings.sql` adds `purchases.rating` + `purchase_options.rating`
  (smallint, null=unrated). RUN THIS LIVE.
- New reusable `components/shared/star-rating.tsx` (out-of-5, read-only or
  interactive `onRate`).
- **Removed top-level favourite stars** (#8): `star-button.tsx` deleted; page no
  longer queries `purchase_stars`; `toggleStar` action left in place (unused).
- **Out-of-5 rating** on items + options (#8/#9): quick-rate stars in the grid
  cards, compact rows (read-only), detail dialog, option rows, and both forms.
  Actions `setPurchaseRating` / `setOptionRating`.
- **Filter + sort by rating** (#8): new "Any rating / N★ and up" filter; default
  sort is now Rating (high→low); removed the sub-category sort.
- **Priority → coloured left accent** (#8): `PRIORITY_ACCENT` in `lib/ui.ts`
  (rose/amber/slate `border-l-*`); applied to cards and compact rows. Badge gone
  from the row, room back on the line.
- **Top-rated open, rest pre-collapsed** (#8): card view passes `defaultOpen` to
  the first (highest-rated) card; others collapse their options (chevron toggle).
- **Removed sub-categories** (#11): dropped from purchase form, detail, grid
  sort, export columns, and `PURCHASE_SUBCATEGORIES` deleted from constants.
  (DB column `sub_category` left in place but unused.)

### Batch M (done) — change-log delete + calendar legend — **needs migration 0017**
- `0017_activity_log_delete.sql` adds a delete RLS policy on `activity_log`
  (household members). RUN THIS LIVE.
- **Change-log delete** (#15): `activity/actions.ts#deleteActivities(ids[])`;
  `activity-list.tsx` has a "Delete entries" mode with per-row checkboxes, a
  count, and a warning dialog before permanent bulk delete.
- **Calendar legend click** (#5): legend chips are buttons; clicking one opens a
  dialog listing all Upcoming + Recent records of that type (links through, or
  opens the day for events).

### Batch N (done) — Groceries / shopping list — **needs migration 0018**
- `0018_shopping_list.sql` adds `shopping_items` (name, quantity, category,
  is_got, got_at) + household RLS. RUN THIS LIVE.
- New nav tab **Groceries** (`/shopping`, ShoppingCart, short "Shop") in
  `constants.ts`; `ShoppingItem` type + Database registry entry.
- `shopping/actions.ts`: add / setShoppingItemGot / delete / clearGotItems.
- `shopping/page.tsx` + `shopping-list.tsx`: add row (name + qty), tick off
  (sinks to bottom, struck through), delete, "Clear got" bulk. Shared list.

### Batch O (done) — purchases revisions — **needs migration 0019**
- `0019_option_frequency.sql` adds `purchase_options.frequency` (default
  'one-off'). RUN THIS LIVE.
- **Low priority by default** everywhere (#2): purchase / project / inspiration
  forms default to "Low".
- **Option payment frequency** (#4): options can be recurring (weekly…annually);
  shown as a `/mo` etc. suffix. The option form's store/url/photo/rating/notes +
  frequency now live behind a collapsible "More details" section; name + one-off
  price are the only top-level fields.
- **Rating placement** (#5): item star rating only shows when the item has NO
  options; items with options are rated via their options. Rating sort/filter use
  an item's best option rating when it has options.
- **Removed the "Purchased" stat** (#6) from the purchases page.

### Batch P (done) — purchase completion details — **needs migration 0020**
- `0020_purchase_completion.sql` adds `purchases.purchased_by`,
  `purchased_price`, `receipt_url`. RUN THIS LIVE.
- Purchases #7: when status is **Purchased**, the form shows an optional block —
  who bought it (household member select), how much they paid, and a receipt
  photo (ImageUpload). `PurchaseForm` now takes a `members` prop, threaded from
  `memberMap` at every call site (page header/empty, grid rows, detail).
- Detail dialog shows a "Purchased — by X · paid £Y · View receipt" block.
- `toRow` only persists these when status is Purchased (cleared otherwise).

### Batch Q (done) — per-user dashboard colour (#18) — **needs migration 0021**
- `0021_member_color.sql` adds `household_members.color`. RUN THIS LIVE.
- `MEMBER_COLORS` palette in `constants.ts` (+ `MEMBER_COLOR_TEXT/DOT`).
- `getHouseholdColors()` (name → colour key) in `household.ts`.
- `components/providers/household-colors.tsx`: context provider +
  `useMemberColorClass(name)` hook + `<ColoredName>`. Provider wraps the whole
  `(app)/layout.tsx` (zero prop-threading — looks colour up by display name).
- `AddedBy` is now a client component that colours the name from context, so
  every "added by" label across the app shows the member's colour automatically.
- Dashboard greeting uses `<ColoredName>`; Settings → Profile has a colour
  picker (`updateMemberColor` action); the household list shows coloured names.

### Batch R (done) — comments + reactions + inspiration read/sink — **needs migration 0022**
- `0022_comments_reactions.sql` adds `comments`, `comment_reads`, `reactions`
  (polymorphic entity_type/entity_id) + household RLS. RUN THIS LIVE.
- `comments/actions.ts`: loadThread / addComment (notifies owner) / deleteComment
  / toggleReaction / markThreadRead.
- `components/shared/item-comments.tsx`: reusable `<ItemComments>` — reaction
  chips + quick emoji, collapsible comment thread with an unread "N new" badge,
  opening marks read; commenter names use their member colour. Notifies the item
  owner via the notifications table.
- Wired into inspiration, purchase and project detail dialogs (#13 begun — "every
  item" can reuse `<ItemComments>`).
- Inspiration read/sink: opening an idea calls `markThreadRead("inspiration")`;
  the page passes `seenIds` to the hub which sinks seen ideas to the bottom and
  dims them; an Eye icon hints "click to open". (#4-list inspiration item)

### Batch S (done, no DB) — Documents & notes (#19)
- Section renamed to **Documents & notes** (nav + page + metadata).
- New `note-form.tsx`: a quick note = a `documents` row with category "Note" and
  no file (reuses `createDocument`). "Note" added to `DOCUMENT_CATEGORIES` and the
  `DocumentCategory` union; excluded from the document form's category dropdown.
- Notes render in a dedicated amber "Notes" card at the top (title + body +
  delete); document groups/stats only show when real documents exist.

### Batch T (done) — editable rooms (#7) — **needs migration 0023**
- `0023_rooms.sql` adds `rooms` (household RLS). RUN THIS LIVE.
- `rooms/actions.ts`: `getRooms()` (falls back to the `ROOMS` constant while the
  table is empty), `addRoom` / `removeRoom` (both seed the defaults into the
  table on first edit so the dropdowns keep the defaults).
- `hooks/use-rooms.ts`: client hook used by purchase + inspiration forms (fetches
  on mount, defaults while loading) — replaced the static `ROOMS` import there.
- Settings → **Rooms** card (`rooms-settings.tsx`) to add/remove rooms.

### Batch U (done, no DB) — glance-stat popups (#17)
- `GlanceValue` gained optional `items: { label, sub?, href }[]`.
- `GlanceStats` wraps any stat that has items in a Dialog — tapping the stat
  pops up the related records (each links through). Dashboard populates items for
  nextBill / monthlyBills / savings / readyToBuy / wishlist / openTasks /
  activeProjects / maintenanceDue / dueThisWeek.

### Batch V (done, no DB) — table views + default (#16)
- `hooks/use-view-prefs.ts`: per-device `useViewPref(section)` (purchases/tasks);
  the stored value is also the default, shared by the page toggle and Settings.
- Purchases grid: third **Table** view (sortable-feel table: item/room/category/
  rating/price/status/delete) alongside Detailed + Compact.
- Tasks: **List**/**Table** toggle; table lists outstanding then done with a tick,
  project, assignee, due.
- Settings → **Default views** card to set each section's default.

### Batch W (done) — bill payments auto-log + mark-paid (#2) — **needs migration 0024**
- `0024_payment_status.sql` adds `bill_payments.is_paid` (existing logged
  payments set paid). RUN THIS LIVE.
- `bills/actions.ts`: `syncBillPayments()` generates each recurring bill's next
  occurrence + up to 12 months of history as unpaid rows (idempotent);
  `setPaymentPaid`, `markHistoryPaid(billId?)` (bulk past-due → paid),
  `updateBillPaymentDetail`. Manual `createBillPayment` now sets is_paid=true.
- `bill-payments.tsx` reworked: auto-syncs on open (then router.refresh);
  each payment has a paid toggle, an "Upcoming"/"Due" tag, click-to-expand detail
  (actual/account/note), a per-bill "Mark all paid (N)" button, and manual Log.
- Analytics now counts only `is_paid` payments so auto-generated due rows don't
  skew the "actually paid" figures.

### Batch X (done, no DB) — calendar export (#calendar email sync)
- `src/app/api/calendar/route.ts`: authenticated `.ics` export (VEVENTs for
  events incl. RRULE, bills with RRULE by frequency, maintenance, project/savings
  targets, document expiries, mortgage term end, open tasks). Download via
  "Export to email/calendar" on the Calendar header (`/api/calendar`).
- A LIVE subscribe feed (auto-updating URL in Gmail/Apple Calendar) was NOT built:
  it needs a public token-protected endpoint + a Supabase service-role key (not
  present). Flagged to the user for a decision.

## UX polish pass (post-feature, "feel like an app")

### Batch Y (done, no DB) — "Needs attention" dashboard strip
- `dashboard/needs-attention.tsx`: action-driving strip at the very top of the
  dashboard. Aggregates overdue/due-today items — unpaid due bill payments
  (fetched `is_paid=false`), overdue/today tasks, overdue maintenance, documents
  expiring ≤14d — colour-coded (rose=overdue, amber=soon), one tap to the record.
  Calm "You're all caught up" state when empty.

### Batch Z (done, no DB) — mobile bottom-sheets
- `components/ui/dialog.tsx` `DialogContent` is now responsive: a bottom sheet
  that slides up on phones (`max-sm:` — full width, rounded top, grab handle,
  slide-in/out-from-bottom) and the centred modal on `sm+`. One change cascades
  to every dialog (details, forms, confirms) across the app — feels native on
  mobile. Caller `max-w-*` caps exceed phone widths so sheets stay full-width.

### Batch AA (done) — payment sync made cheap
- `syncBillPayments(billId?)` syncs just the opened bill and returns `inserted`;
  the panel syncs ≤ once/day/device and only `router.refresh()`es when rows were
  created. (No more all-bills scan + refresh on every dialog open.)

### Batch BB (done, no DB) — prefs consolidated + cookie-backed (no SSR flash)
- `lib/prefs.ts` (one `mhd_prefs` cookie holding all UI prefs as JSON) +
  `components/providers/prefs.tsx` (`PrefsProvider` seeded server-side from the
  cookie; `usePref(key, fallback)`; one-time localStorage→cookie migration).
- `(app)/layout.tsx` reads the cookie via `next/headers` and wraps the app in
  `PrefsProvider`, so the first paint already has the right tabs/widgets/views
  (no default→stored flicker).
- The five hooks (`use-hidden-tabs`, `use-dashboard-prefs`, `use-bottom-tabs`,
  `use-glance-prefs`, `use-view-prefs`) are now thin wrappers over `usePref`
  with identical public APIs — every ~100-line localStorage+custom-event hook
  collapsed to a few lines; context keeps consumers in sync (no custom events).

### Batch CC (done, no DB) — sticky dialog footer + comments everywhere
- `DialogFooter` is now sticky to the bottom of the mobile sheet (bg + blur +
  top border) so Save stays above the on-screen keyboard in long forms.
- `<ItemComments>` added to the remaining detail dialogs: **bills, tasks,
  maintenance, savings pots, documents** (already on inspiration/purchases/
  projects). Comments + reactions are now on every item type. (Relies on the
  comments tables from migration 0022.)

### Batch DD (done, no DB) — simpler Projects & Tasks
- Collapsed the confusing 3-tab layout (Tasks / Board / List) into **two clear
  tabs: Tasks and Projects** (with counts + icons). Board vs List is now a small
  toggle inside the Projects tab; the old compact/detailed list toggle is gone.
- Each tab has a one-line explainer of the model (Tasks = to-dos; Projects =
  bigger work with their own tasks).
- Project cards now show a **task progress bar** (done/total) and a status-coloured
  left accent (`STATUS_BORDER` in `lib/ui.ts`), so progress is obvious at a glance.
- `?project=` deep-links open the Projects tab; empty-projects state added.
- Refreshed the page description/help to match.

### Batch EE (done, no DB) — small clarity fixes
- Removed the **Project value** stat card from the projects page.
- **Calendar:** opening a day no longer pops the keyboard — `onOpenAutoFocus`
  prevented on the day + legend dialogs; keyboard only appears when you tap the
  add-event input.
- **Glance stats** now always open their popup when tapped (even when empty,
  showing "Nothing here yet"), so e.g. "Ready to buy" reliably lists its items.
- **Needs attention** empty state is now a single concise line ("All caught up —
  nothing due.") that won't wrap on mobile.

## Room Designer (new platform feature) — multi-phase

### Batch FF (done) — Phase 1 foundation — **needs migration 0025**
- `0025_room_designer.sql`: extends `rooms` (shape, width/length/height_cm,
  wall/ceiling/floor/trim colours, flooring, doors/windows jsonb, notes,
  project_id, updated_at + the missing UPDATE policy + set_updated_at trigger);
  new tables `room_design_versions`, `room_design_layout_items`,
  `room_colour_palettes`, `room_colour_swatches`,
  `room_design_inspiration_links` — all household RLS. RUN THIS LIVE.
- Rooms are now first-class entities (no second system): nav item **Room
  Designer** (`/rooms`, Sofa icon). `rooms/actions.ts` gained `getRoomEntities`
  (seeds defaults, dedupes by name), `updateRoomDetails`, and design-version CRUD
  (`createDesignVersion`, `updateDesignVersion`, `duplicate`, `delete`,
  `setStatus`, `markFinal` — snapshots room dims/colours).
- `/rooms` list (cards: dims + design/item/idea counts, final badge).
- `/rooms/[id]` workspace (`room-workspace.tsx`) with tabs: **Overview**
  (autosaving dimensions in metres + colour pickers + flooring + project link +
  notes), **Design** (version cards: status, cost, colour chips; add / edit /
  duplicate / mark-final / delete), **Items** (purchases tagged to the room with
  planned/spent totals, link out), **Ideas** (inspiration tagged to the room),
  **Tasks** (one-tap create incl. suggestions, routed to the room's project).
- Purchases/inspiration link by their existing `room` text field — no dup data.

### Batch GG (done, no DB) — Phase 1: 2D floor planner
- `rooms/actions.ts`: `addLayoutItem` (returns the row), `updateLayoutItem`,
  `deleteLayoutItem`.
- `/rooms/[id]/design/[versionId]` → `floor-planner.tsx`: SVG canvas scaled to
  the room (viewBox in cm), 50cm grid, drag furniture (pointer events, snap 5cm,
  clamped to walls), tap-to-select, rotate (swaps W/D), resize (cm inputs),
  colour palette, delete, add-furniture dialog with category presets. Live
  "% floor used" + red overlap warnings. Optimistic local state, autosaves per
  change (no full refresh). "Plan layout" button on each design version card.

### Batch HH (done, no DB) — Phase 2a: Colour Studio + photo extraction
- `lib/colour.ts`: `extractPalette(img, n)` (canvas average-bucket quantise),
  `sampleColour(img, xRatio, yRatio)`, `rgbToHex` — no deps.
- `rooms/actions.ts`: `createPalette`, `deletePalette`, `addSwatches(hexes[])`,
  `deleteSwatch`.
- `colour-studio.tsx` (new **Colours** tab in the room workspace): create
  palettes, add colours by hand (`<input type=color>`), and **From photo** —
  upload/take a photo, auto-extract up to 8 dominant colours, tap the image to
  sample any pixel, pick which to keep, save into the palette. Delete swatches /
  palettes. Room detail page now fetches `room_colour_palettes` + swatches.

### Batch II (done, no DB) — Phase 2b: planner ↔ purchases
- `rooms/actions.ts` `createPurchaseFromLayout(itemId, roomName)`: creates a
  wishlist purchase (category Furniture, room = room name, price = item cost) and
  links it back via `layout_item.purchase_id` (status → planned). No duplicate
  data — the purchase lives in Purchases, the planner just references it.
- Floor planner selected-item panel: **install Status** select
  (idea→installed) and **Create purchase** / **Linked purchase →** link.

### Batch JJ (done, no DB) — Phase 3: version comparison
- `/rooms/[id]/compare` — side-by-side columns (horizontal scroll on mobile) for
  all non-archived versions: cost (estimate or summed item costs; cheapest
  highlighted), furniture count, % floor used, colour chips, item list, link to
  each plan. "Compare" button on the Design tab (shown once ≥2 versions).

### Batch KK (done, no DB) — Phase 3 cont.: budget rollup + timeline
- Items tab: **Budget by category** table (planned vs spent, from the room's
  purchases grouped by category).
- Overview tab: **Timeline** card — room created, each design version added,
  items planned, items bought (most recent first, from existing data).

## New request list (2026-06, big batch) — in progress, small shippable batches

### Batch A (done, no DB) — room rename + cramped tabs + camera capture
- Settings → Rooms: **rename rooms inline** (`renameRoom` also updates the
  `room` field on tagged purchases/inspiration so links survive).
- Room workspace tabs no longer wrap/overlap the description — single
  horizontally-scrollable row (`overflow-x-auto` + `TabsList w-max`); Overview
  header row fixed.
- `ImageUpload` now offers **Take photo** (camera, `capture=environment`) and
  **Gallery** — used everywhere images are uploaded.

### Batch B (done, no DB) — ratings only on options
- Removed the item-level star rating from the purchase form, detail dialog and
  grid (compact + card). Ratings now live only on **options**. Table view shows
  an item's best option rating (`effectiveRating`). `purchases.rating` column +
  `setPurchaseRating` action remain (unused) for back-compat; harmless.

### Batch C (done, no DB) — simpler purchase add-form
- Removed the "specific item / compare options" mode toggle. Every item is now
  just "What do you want?" + category/room/priority/status, and you **add the
  options up front** (name/price/store/link rows) when creating it.
- New `createPurchaseWithOptions(input, options[])` action; the form posts the
  item + its options in one go. Editing still manages options on the card.

### Batch D (done, no DB) — clickable sub-tasks
- `TaskEditDialog` exported from `tasks/tasks-view.tsx` (projects/members props
  now optional). `Subtasks` wraps each sub-task title in it, so tapping a
  sub-task opens its full editor (notes, due date, comments, links).

### Batch E (done) — quick photos / misc shoebox — **needs migration 0026**
- `0026_quick_photos.sql`: `quick_photos` table (image_url, label) + household
  RLS. RUN THIS LIVE.
- New **Photos** nav + `/photos` page (grid, inline label, delete) and a
  **Photo** action in the + quick-add menu. `QuickPhotoDialog` reuses
  `ImageUpload` (camera or gallery). `photos/actions.ts`: add/update/delete.

### Batch F (done) — room shapes + doors — **needs migration 0027**
- `0027_room_outline.sql`: `rooms.outline jsonb` (polygon points in cm). RUN LIVE.
- `lib/room-shape.ts`: rect/L-shape outline builders + `outlinePoints`/`pointsToSvg`.
- `room-shape-doors.tsx` (Overview): **Shape** (rectangle/square/**L-shape**/custom);
  L-shape exposes cut-out width/depth (m) and stores the polygon outline.
  **Doors** editor — add doors with wall + offset-from-corner + width.
  `updateRoomDetails` now accepts `outline` + `doors` (jsonb).
- Floor planner draws the **polygon outline** (L-shapes) and **door gaps** on the
  walls. NOTE: furniture still clamps to the bounding box, not the polygon — a
  future refinement could clamp to the actual outline.

### Batch G (done) — Drafts — **needs migration 0028**
- `0028_drafts.sql`: `drafts` table (kind, title, notes, image_url) + RLS. RUN LIVE.
- **Draft** action in the + quick-add menu (`DraftDialog`: kind + title + notes +
  photo) and a **Drafts** nav/page listing them with a "Continue" link to the
  relevant section + delete. `drafts/actions.ts` add/update/delete; `draft-meta.ts`
  maps kind → destination.
- NOTE: this is a quick-capture drafts shoebox (matches notes/photos pattern).
  A deeper "Save as draft from inside each add-form + resume exact form state"
  was intentionally NOT built (large, touches every form) — candidate follow-up.

### New request list — all items addressed (see batches A–G above).

### Batch K (done, no DB) — three simplifications
- **Room workspace 6 → 4 tabs**: Colours folded into Design (section below
  versions), Ideas folded into Items (section below purchases).
- **Settings grouped** under headings: Your profile · Layout & display · Data &
  alerts · Household & account (`SettingsSection`).
- **Leaner dashboard by default**: `DEFAULT_DASHBOARD_HIDDEN` hides reminders,
  maintenance, inspiration, purchases & activity widgets by default, so it leads
  with Needs attention + glance + week ahead. Re-enable any via Edit dashboard.

### Batch J (done, no DB) — grouped tab-visibility settings
- Settings → Sidebar tabs now lists tabs under the same group headings as the
  nav, for consistency.

### Batch I (done, no DB) — grouped navigation
- The sidebar/mobile menu (~16 items) is now grouped under headings:
  Overview · Money · Planning · Home · Capture · Calendar (`NavItem.group` +
  `NAV_GROUPS` in constants; `SidebarNav` renders sections, flat list while
  searching). Much easier to scan than a flat list.

### Batch H (done, no DB) — manual room-shape editing on the grid
- Floor planner gains an **Edit shape** mode: drag the outline's corners
  (snap to grid), tap **+** on an edge to add a point, **×** to remove (min 3).
  Saves `rooms.outline` (+ shape="custom") via `updateRoomDetails`. Furniture is
  dimmed/non-interactive while editing. "Reset to rectangle" restores the box.
  (Furniture still clamps to the bounding box, not the custom polygon — noted.)
- Room shapes beyond rectangle (L-shape/polygon from real plans) + door
  placement in the planner; broader "make the UI simpler".

### Room Designer — STILL TODO (optional, schema already in place)
- Mood boards; attach a palette to a design version (Ideas tab already acts as a
  room mood board via inspiration tagged to the room).
- Phase 4: lightweight 3D (adds Three/R3F); PDF/PNG export.

NOTE for whoever continues: Room Designer MVP (Phases 1–3 core) is shipped and
working. All Room Designer SQL is in migration 0025 (already run). Remaining
items above are enhancements; none need new SQL except possibly mood boards
(could reuse room_design_inspiration_links + a notes field — no new table
strictly required).
- Phase 2: Colour Studio + photo/camera colour extraction (canvas, no deps) →
  `room_colour_palettes`/`swatches`; mood boards; deeper purchase linking
  (create purchase from furniture, install status, layout position).
- Phase 3: project budget rollup, version comparison (side-by-side), timeline.
- Phase 4: lightweight 3D (R3F/Three — would add deps), validation, export.

STILL TODO (optional, needs the user or external access):
- Generate Supabase types instead of hand-writing `database.types.ts` (needs the
  Supabase CLI + DB connection — can't run from the sandbox).
- Trim dashboard/settings queries to only needed columns (deferred — low gain,
  some risk; left as-is).
- Optional: live calendar subscribe feed (needs service-role key + token table).

Still TODO from third list: #2 payments auto-log/mark-paid/detail,
#7 editable rooms, #12 options-at-create-time (card now collapses
options pre-collapsed — partial), #13 comments system, #14 tasks
recently-completed, #15 change-log delete, #16 table views + default, #17
glance-stat click popup, #18 per-user colour, #19 documents+notes.

## 0. Latest session (Claude, after Codex continuation)

Codex completed the entire first big list (#11–#28: non-negotiables, my-items
filter, change-log filters, inspiration social feed + embeds, collapsible linked
items, notifications, clickable calendar days, bills accounts/payments/end-date,
export-to-settings, WhatsApp share, item timestamps, per-tab `SectionActivityLog`).
Migrations 0009–0013 are RUN LIVE; production deployed.

The user then submitted a **second** big list (2026-06-25, "do my stuff").
Working through it in build+lint-verified batches.

### Batch A (done, no DB): dashboard/UX quick wins
- Dashboard sections **collapsed by default** (`collapsible-section.tsx`).
- Removed the **quick-add** (`QuickActions`) block from the dashboard (FAB covers it).
- **Activity by household** section added at the bottom of the dashboard
  (`SectionActivityLog` now accepts no `entityTypes` = all activity; new widget
  id `activity` in `DASHBOARD_WIDGETS`).
- **Compact by default** in bills / maintenance / purchases / projects-list.
- Removed the **project value (Costs) view** from `projects-views.tsx`
  (CostSummary + its imports gone).
- "**End date (optional)**" label on the bill form.

### Batch B (done): task notes + clear completed — **needs migration 0014**
- `0014_task_notes.sql` adds `project_tasks.notes`. RUN THIS LIVE.
- Task editor has a **Notes** textarea (createTask/updateTask accept `notes`).
- **Clear completed**: button in the Tasks "Done" card archives all done tasks
  (`clearCompletedTasks` action). Cleared tasks move to the Archived-tasks
  section (restore/delete) AND still count toward project progress, because the
  projects page now builds each `project.tasks` from ALL tasks (incl. archived);
  `Subtasks` shows active ones + an "N cleared (kept for progress)" line.

### Batch C (done): calendar events — **needs migration 0015**
- `0015_calendar_events.sql` adds `calendar_events` (title, event_date,
  recurrence none/weekly/monthly/yearly, notes) + household RLS. RUN THIS LIVE.
- `calendar/actions.ts`: `createCalendarEvent`, `deleteCalendarEvent`.
- Calendar page expands recurring events across a window (now − 2mo … now + 18mo)
  into `CalEvent`s (type `event`, carries `id`); passes the actions to the view.
- `CalendarView`: "+ Event" button (opens today's day dialog), each day dialog
  has an inline add-event form (title + recurrence) and custom events get a
  delete ×. The empty-state is gone (you can always add). New `event` type
  styled fuchsia in the legend.

### Batch D (done, no DB): search + dark-mode move
- Dark mode moved into the **profile (initials) menu** (`user-menu.tsx`, uses
  next-themes); the standalone top-bar `ThemeToggle` is removed from
  `(app)/layout.tsx` (Settings still has the Appearance card).
- **Global search**: top-bar search icon → dialog (`global-search.tsx`) that
  calls `app/(app)/search/actions.ts#searchItems` (ilike across bills/projects/
  tasks/purchases/inspiration/maintenance/documents/savings) and deep-links to
  each result.
- **Sidebar tab search**: a "Search tabs…" filter box at the top of
  `sidebar-nav.tsx` filters the visible nav items.

### Batch E (done, no DB): point-out to a household member
- `notifications/actions.ts#listOtherMembers` returns household members ≠ self.
- `components/shared/point-out-button.tsx` (`PointOutButton{label, href}`): a
  bell+ icon → dialog listing other members → `sendNotification(member, "Take a
  look: …", href)`. Added next to ShareButton in all 7 detail dialogs (bill,
  document, inspiration, maintenance, project, purchase, savings pot).

### Batch F (done, no DB): week-ahead strip + admin button
- `dashboard/week-ahead.tsx` (`WeekAhead`): compact next-7-days strip with a
  badge per day for how much is on it (bills due, tasks due, maintenance,
  doc expiries, project/savings targets, and calendar_events incl. recurrence
  via `eventOccursOn`). New dashboard widget id `week`; links each day to
  `/calendar`. Dashboard fetches `calendar_events` for this.
- `components/shared/bottom-admin.tsx` (`BottomAdmin`): small collapsed-by-
  default disclosure for admin actions. Bills page now renders the
  **Payment accounts** manager inside it at the **bottom** instead of mid-page.

### Batch G (done, no DB): per-user glance-stat customisation
- `hooks/use-glance-prefs.ts` (localStorage `mhd:glance-stats`, ordered ids,
  `DEFAULT_GLANCE`).
- `dashboard/glance-stats.tsx`: `GLANCE_CATALOG` (9 stats), `GlanceStats`
  (renders chosen stats in order from values passed by the page) and
  `GlanceStatsSettings` (pick + reorder + add/remove). Dashboard computes
  `glanceValues` for all catalog ids and renders `<GlanceStats>` in the
  `finance` widget. Settings has a new **Dashboard glance stats** card.

### Batch H (done, no DB): bottom tab bar with centre +
- Extracted the add-menu pills to `components/layout/add-menu.tsx` (`AddPills`,
  `Pill`). `FloatingAdd` is now **desktop-only** (`hidden lg:flex`) and uses it.
- `bottom-nav.tsx` rewritten: configurable tabs (from `use-bottom-tabs.ts`,
  default dashboard/bills/projects/inspiration — Inspiration tab added) split
  around a **centred + button** that opens the AddPills sheet on mobile.
- Settings: new **Bottom bar tabs** card (`settings/bottom-tabs.tsx`) to pick up
  to 4 tabs and order them.

### Batch I (done, no DB): full-screen project board
- Projects → Board tab has a **Full screen** button opening `BoardFullScreen`
  (a `fixed inset-0` overlay) that stacks statuses **vertically** with their
  project cards — mobile-friendly "where are we at" view. Cards keep their
  status select so you can move projects from the overview.

### Batch J (done, no DB): analytics — payments trend + expected vs actual
- Analytics page now leads with the **bill payments** ledger: 6-month
  Expected / Actually-paid / variance stat cards, an **Actually paid by month**
  area chart, and a **Biggest differences vs expected** list (over = red,
  under = green). Falls back to a hint when no payments are logged. Existing
  category breakdowns remain below.

### ✅ SECOND LIST COMPLETE
Every item from the user's 2026-06-25 "do my stuff" list is implemented and
merged to `main` (PRs #26–#34). No outstanding feature work from that list.
Migrations the user must have run live: 0009–0015 (0014 task notes, 0015
calendar events are the newest — confirm they were applied). Next ideas if the
user wants more: email reminders, richer per-category trends, drag-and-drop
reordering for prefs, assignee avatars.
5. **Admin actions** (e.g. add payment account) as a **small button at the bottom
   of the page** rather than inline.
6. Dashboard: a **small week-ahead calendar** strip.
7. **Bottom tab bar**: put the **+ (FAB) in the middle**; add an **Inspiration**
   tab; in Settings let the user **choose which bottom tabs show and their order**
   (localStorage prefs like sidebar/dashboard).
8. **Projects board**: an **expandable full-page, mobile-optimised** board view.
9. **Tasks**: replace the X-on-complete with **clear/archive against the project**
   (keep for progress), and **add notes to tasks** (needs `project_tasks.notes`).
10. **Analytics**: rebuild around **actionable insight** — monthly payment
    **trends** and **expected vs actual** (uses Codex's `bill_payments`).
11. **Settings → glance stats**: let each user pick **which glance stats** show and
    **their order** (per-user customisation; extend dashboard prefs).
12. Meta: the user wants to be told **when their Claude usage resets in UK time**
    (agent can't see this — acknowledge, can't compute their plan reset).

---

## 1. What this project is

A production-ready, mobile-first **home-management web app** for a single
household (currently Eashan + Neelam, plus an optional public **demo** account).
It tracks bills, mortgage, savings pots, projects & tasks, a purchase wishlist,
inspiration, maintenance, documents, a calendar of key dates, analytics and a
change log. Everything starts empty — no seed data in the real account.

Deployed on **Vercel**, data in **Supabase** (Postgres + Auth + Storage).

---

## 2. Tech stack & important versions

- **Next.js 15** (App Router, route group `(app)`), **React 19** (stable).
- **TypeScript**, **Tailwind CSS**, **Radix UI** primitives, **lucide-react** icons.
- **Recharts** for charts. **react-hook-form** + **zod** for forms.
- **Supabase**: `@supabase/ssr@0.12.0` + `@supabase/supabase-js@2.108`.
- `.npmrc` has `legacy-peer-deps=true` (needed for the React 19 peer-dep set).
- Build/test command: `npm run build` (this is the only verification available
  in the sandbox — there is no test suite).

### Hand-written Supabase types (important quirk)
`src/lib/database.types.ts` is **hand-written** (not generated). Every table is
registered in the `Database` type as `Row<T>` where:
```ts
type Row<T> = { Row: T; Insert: Partial<T>; Update: Partial<T>; Relationships: [] };
```
and the `Database` type must include `Views/Functions/Enums/CompositeTypes: { [_ in never]: never }`.
When you add a table or column: update the matching `export type X` **and** the
`Database['public']['Tables']` map, or queries will be typed `never`.

**Dynamic table/column queries don't type-check** against this client (the table
name must be a literal). When you must query a table chosen at runtime, cast the
client to an untyped view — see `src/app/(app)/links/actions.ts` (`const db =
supabase as unknown as {...}`) for the pattern.

---

## 3. Hard environment constraints (READ THIS)

- **The sandbox cannot reach the network** (Supabase, Vercel, etc. are blocked by
  an egress allowlist). Therefore:
  - **You cannot run SQL migrations.** Hand the SQL to the user; **they run it**
    in the Supabase SQL editor. The user has asked to **always paste SQL inline**
    in chat (not just reference a file).
  - **You cannot deploy or test against live data.** Vercel auto-deploys on
    merge/push to `main`.
  - You verify code only with `npm run build`.
- **Supabase SQL editor gotchas** (learned the hard way):
  - `DO $$ ... $$` blocks sometimes mis-parse ("syntax error at or near …").
    Prefer **flat `INSERT ... SELECT` / plain statements** over PL/pgSQL when
    giving the user a script. The demo seed was rewritten this way
    (`supabase/seed_demo.sql`).
  - The Monaco editor auto-inserts closing brackets; tell the user to clear the
    box first.

---

## 4. Git / delivery workflow

- Create a fresh feature branch from `main` for each new batch. Historical
  branches include `claude/home-dashboard-build-yv7ewz` and
  `codex/continue-dashboard-backlog`.
- **Never** force-push or rewrite history. Push with `git push -u origin <branch>`.
- **PR-per-batch**, merged to `main` with **merge method "merge"** (NOT squash —
  squash previously caused merge conflicts on later PRs).
- Commit message trailers used:
  ```
  Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>
  Claude-Session: https://claude.ai/code/session_017mR7RDeokCTWYrs2NtLThf
  ```
- PR bodies end with the Claude Code generated-with footer.
- **Do not** put the model identifier in commits/PRs/code — chat only.
- GitHub repo: `eashankaradia/my-house-dashboard`. GitHub access is via MCP
  tools (`mcp__github__*`) in this environment; a plain `gh` CLI is not available.

---

## 5. Auth & household model (critical for RLS-correct features)

- **Username + password** login. There is **no signup UI**: accounts are created
  in the **Supabase dashboard → Authentication → Users** with **Auto Confirm**.
- Usernames map to a fake email: `username@myhouse.local` (see
  `src/lib/auth-username.ts`, `usernameToEmail()`). E.g. login `eashan` →
  `eashan@myhouse.local`.
- `handle_new_user` trigger creates a `profiles` row on signup (only).
- **Household sharing is per-household** (migration 0008). Rows carry `user_id`
  (creator, for "Added by" attribution). Visibility RLS on every data table is:
  `auth.uid() = user_id OR public.same_household(user_id)`.
  - `same_household(target)` = current user and `target` share a `household_id`
    in `household_members`. SECURITY DEFINER so the inner read bypasses RLS.
  - Existing members (Eashan, Neelam) were backfilled into ONE shared household.
  - New `household_members` rows default `household_id` to a fresh UUID (isolated).
  - The legacy `is_household_member()` still exists but is no longer used for row
    visibility — **use `same_household(user_id)` in new RLS policies.**
- **Demo account:** `demo@myhouse.local` / `demohouse`, lives in its own
  household. Seeded by `supabase/seed_demo.sql` (idempotent; flat statements).
  `src/lib/household.ts` `getHouseholdMap()` returns `{ user_id: display_name }`.

---

## 6. Database: migrations & current state

Canonical full build: **`supabase/schema.sql`** (always mirror schema changes
here too). Incremental migrations in `supabase/migrations/`:

| File | What it adds |
|---|---|
| 0001_add_purchase_subcategory.sql | `purchases.sub_category` |
| 0002_add_purchase_options.sql | `purchase_options` (compare products) |
| 0003_ranking_household_subtasks.sql | `household_members`, `is_household_member()`, RLS, option ranking, project sub-tasks |
| 0004_activity_log.sql | `activity_log` + `log_activity()` trigger (change log) |
| 0005_images_price_tracking.sql | image upload + option price tracking |
| 0006_rollback_ai.sql | **drops** the unused `ai_*` placeholder tables |
| 0007_savings_accounts_contributions.sql | `savings_accounts`, `savings_contributions` |
| 0008_household_isolation.sql | `household_members.household_id`, `same_household()`, per-household RLS on all tables + activity_log |
| 0009_assignees_stars_archive.sql | `project_tasks.assigned_to` + `archived_at`; `projects.archived_at`; `purchases.archived_at`; `purchase_stars` table |
| 0010_links.sql | `links` table (generic cross-entity associations) |
| 0011_purchase_requirements.sql | `purchases.non_negotiables` |
| 0012_bill_accounts_payments.sql | payment accounts, bill end/account fields, expected-vs-actual payment log |
| 0013_notifications.sql | notification preferences, inbox, automatic household updates, manual pushes |

### ⚠️ Migrations the user must run (verify with them)
The user runs SQL manually. As of this writing, **0009 and 0010 may not yet be
run** — features depending on them silently fail to persist until they are:
- **0009** → task assignees, archiving (projects/purchases/tasks), purchase stars.
- **0010** → linking items together.
Re-paste these inline if the user reports those features "not saving". Both are
in `supabase/migrations/`. They depend on `same_household()` (0008), which is run.

---

## 7. Directory map & key building blocks

```
src/
  app/
    (app)/                     # authed route group (sidebar + FAB layout)
      layout.tsx               # renders <FloatingAdd/> (the + button) on every page
      dashboard/               # home; customizable widgets
        page.tsx               # server: fetches everything, renders widgets
        dashboard-customize.tsx# DashboardWidget + EditDashboardButton (localStorage prefs)
        quick-actions.tsx
      bills/ mortgage/ savings/ projects/ purchases/ inspiration/
      maintenance/ documents/ calendar/ analytics/ activity/ settings/
      tasks/                   # tasks-view.tsx ONLY (no route page; used by projects)
      links/                   # actions.ts + linked-items.tsx (cross-linking)
    auth/ login/
  components/
    ui/                        # Radix-based primitives (dialog, button, etc.)
    shared/                    # PageHeader, EmptyState, StatCard, CardTrigger,
                               # ConfirmDelete, AddedBy, ArchivedSection,
                               # FormDeleteButton, ExportButton, image-upload, etc.
    layout/                    # sidebar, mobile nav, floating-add.tsx (FAB)
    charts/                    # area/bar/donut chart wrappers (Recharts)
  hooks/                       # use-toast, use-hidden-tabs, use-dashboard-prefs,
                               # use-open-from-url
  lib/                         # supabase clients, database.types.ts, schemas.ts,
                               # constants.ts, utils.ts, household.ts, ui.ts, action-utils.ts
supabase/
  schema.sql                   # canonical full build (keep mirrored)
  migrations/                  # 0001..0010
  seed_demo.sql                # demo data (flat, idempotent)
HANDOFF.md                     # this file
```

### Reusable patterns you MUST know
- **Server actions** live in each section's `actions.ts`, start with `"use server"`,
  use `getActionContext()` (from `src/lib/action-utils.ts`) which returns
  `{ supabase, user }`, return `ActionResult` (`{ error?: string }` or `{}`), and
  call `revalidatePath(...)` for affected routes (and usually `/dashboard`).
- **`CardTrigger`** (`components/shared/card-trigger.tsx`): a `<div role="button">`
  used as a Radix `DialogTrigger asChild` child so a **whole card** can open a
  detail dialog while still containing block content. Action buttons (edit,
  delete, +/-, status) are kept **outside** the CardTrigger as siblings so they
  work independently. This is how every list card became clickable.
- **`useOpenFromUrl(id, param = "item")`** (`hooks/use-open-from-url.ts`): makes a
  detail dialog open when the URL has `?<param>=<id>`; closing strips the param.
  Every detail dialog is a **controlled** `<Dialog open onOpenChange>` driven by
  this hook. Deep links: dashboard rows, calendar events, change-log entries link
  to `/section?item=<id>` (or `?project=` / `?task=` where a page holds two entity
  types). Projects page opens its **List** tab when `?project=` is present
  (project cards only mount there).
- **Detail dialogs** (`*-detail.tsx`): `<Dialog open onOpenChange>` +
  `<DialogTrigger asChild>{children}</DialogTrigger>` + content. Pattern is
  identical across bills/purchases/projects/inspiration/maintenance/savings.
- **Edit forms** (`*-form.tsx`): react-hook-form + zod. When `editing`, the footer
  shows a delete (`FormDeleteButton`) and, for projects/purchases, an archive
  button. Footer uses `DialogFooter className="sm:justify-between"` with actions
  left, Cancel/Save right.
- **`ArchivedSection`** (`components/shared/archived-section.tsx`): collapsible
  "Archived (N)" panel with Restore/Delete. Takes `items`, `noun`, and server
  actions `onRestore`/`onDelete` (must be **real server actions**, not inline
  closures — server→client function props must be server actions). Restore actions
  are single-arg wrappers: `restoreProject`, `restorePurchase`, `restoreTask`.
- **`LinkedItems`** (`app/(app)/links/linked-items.tsx`): the cross-linking UI;
  fetches via `getLinks`, adds via `createLink`, removes via `deleteLink`,
  picker uses `listLinkTargets`. Rendered inside each detail dialog + the task
  editor.
- **localStorage prefs**: `use-hidden-tabs` (sidebar tab visibility, in Settings)
  and `use-dashboard-prefs` (dashboard widget visibility). Both sync via a custom
  window event; initial render shows everything (matches SSR) then applies prefs
  after mount to avoid hydration mismatch.

---

## 8. Feature inventory (what's built)

Core sections: **Dashboard, Bills & Expenses, Mortgage, Savings Pots, Projects &
Tasks, Future Purchases, Inspiration, Maintenance, Documents, Calendar,
Analytics, Change log, Settings** (Settings is in the profile menu, not the main
nav). Sidebar nav defined in `src/lib/constants.ts` (`NAV_ITEMS`).

Recently added (chronological, by PR):
- **AI rollback** (#14): removed unused `ai_*` scaffolding (schema, README,
  migration 0006).
- **Tasks merged into Projects** (#14): the Projects page has a **Tasks** tab
  (`tasks/tasks-view.tsx`); the standalone `/tasks` route was removed.
- **Change log tab** (#14): `/activity` page; removed from Settings.
- **FAB fix** (#14, #17): the floating **+** button. NOTE history: an earlier
  "always-mounted forms" version created an **invisible `z-40` overlay** down the
  right edge that swallowed taps (broke savings +/- and compact toggles). Current
  version (`components/layout/floating-add.tsx`) renders the form pills **only
  when the menu is open** and does **not** close the menu on pill tap (closing
  unmounted the form before its dialog opened). If interactivity mysteriously
  breaks app-wide, suspect a global overlay again.
- **Savings accounts + contributions** (#15): pots hold money across multiple
  named accounts; a back-datable contributions ledger; balance-over-time chart in
  the pot detail.
- **Clickable change log + tasks; mobile tap tuning** (#15): `globals.css` adds
  `touch-action: manipulation` + active-press feedback.
- **Per-household isolation + demo** (#16): migration 0008 + `seed_demo.sql`.
- **FAB/clickable/resilient +/-** (#17): see FAB note above; `adjustPot` now
  updates the balance first then logs the contribution best-effort.
- **Deep-link items** (#18): `useOpenFromUrl`; dashboard/calendar/change-log open
  the specific item.
- **Big batch** (#19): whole-card clickable everywhere (CardTrigger); dashboard
  section headers link to their tab; savings **QuickContribute** (manual amount or
  add-the-monthly, replacing fixed +/-); **purchase favourites/stars** (who
  starred); **task assignees** + "All/Mine" filter; **archiving**
  (projects/purchases/tasks) with ArchivedSection; **trash-in-edit** on all edit
  forms; **customizable dashboard** (EditDashboardButton / DashboardWidget).
  Needs migration **0009**.
- **Cross-linking** (#20): `links` table; LinkedItems in every detail dialog +
  task editor. Needs migration **0010**.
- **HANDOFF.md** (#21): this document.
- **Dashboard redesign** (#22, no DB): rewrote `dashboard/page.tsx` to be
  glance/actionable-only. Removed the info button, the Monthly-bills stat, and
  the Savings-progress card. Greeting now uses the household display name
  (`memberMap[user.id]`). "Edit dashboard" is icon-only. New
  `dashboard/collapsible-section.tsx` — each section is a `CollapsibleSection`
  (title links to its tab, a count badge of what's coming up, collapse toggle),
  still wrapped in `DashboardWidget` for show/hide. Glance stats reduced to Next
  bill due / Savings balance / Ready to buy. Open-projects rows are one line
  (`name · status · N to do`) plus an "Upcoming tasks" sublist (soonest-due
  tasks). Inspiration + wishlist rows show timestamps; wishlist excludes
  Purchased. `DASHBOARD_WIDGETS` updated (dropped `savings`). Purchases page
  stats: removed Wishlist value, added Ready-to-buy value; Purchased shows a
  count not a value.
- **Codex continuation batch** (branch `codex/continue-dashboard-backlog`):
  restored Claude's unpushed batch-2 work: collapsible linked items, Purchases
  All/Mine filter, Change-log user/tab filters, and native-share/WhatsApp
  fallback in main detail dialogs. Added created/updated timestamps to main item
  dialogs and made default edit actions read "Edit". Added purchase
  non-negotiable features/qualities (migration 0011). Typecheck and lint pass.
  Added a shared Recent updates card to the bottom of Bills, Mortgage, Savings,
  Projects & Tasks, Purchases, Inspiration, Maintenance, and Documents.
  Added proper bill payment accounts (joint or associated with a household
  member), account dropdowns on bills, bill end dates, and a payment-history
  ledger that defaults actual to expected and reports expected-vs-actual totals
  and differences. Requires migration 0012. Typecheck and lint pass.
  Added notifications: per-section preferences in Settings, automatic household
  update notifications, unread badge/inbox, mark-read controls, and manual
  push-to-household-member messages. Requires migration 0013. Typecheck and lint
  pass.
  Made every calendar day cell clickable. A day-detail dialog lists everything
  scheduled that day and links to each exact item. Typecheck and lint pass.
  Reworked Inspiration so the default view is a scrollable social-style feed,
  while retaining masonry/cards/list database views and filters. Instagram
  posts/reels, Facebook videos, TikTok video URLs, and YouTube links render
  inline when their URL can be converted to an embed; unsupported links retain
  an open-original fallback. Typecheck and lint pass.
  Removed Bills, Purchases, Projects, and Maintenance per-tab CSV buttons.
  Settings now has one Export data card with a dataset picker and CSV download.
  Typecheck and lint pass.

### ⏳ Large outstanding request (batches still to do)
The user submitted a big list (2026-06-25). Done so far: dashboard redesign +
purchases stat tweaks (above). **Still TODO** (no code yet — pick up here):
1. **Edit labels:** done for main forms and remaining compact-row/account/option
   pencil actions.
2. **Timestamps:** done for main item dialogs, tasks, purchase options, and
   savings accounts.
3. **Per-tab update log** — done for every data-management section via the
   shared `SectionActivityLog` component.
4. **Purchases:** done in code — non-negotiable features/qualities field
   (migration 0011) and "my items" filter.
5. **Change log:** done — filter by user and by tab (entity type).
6. **Inspiration:** done — social-feed default plus existing database
   filters/views and inline supported social/video embeds.
7. **Linked items collapsible** inside all popup cards — done.
8. **Notifications:** done in code — per-user section preferences, automatic
   household update notifications, inbox/unread state, and manual pushes.
   Requires migration 0013.
9. **Calendar:** done — clickable days open a detail dialog of that day's events.
10. **Bills:** done in code — payment accounts, user/joint association, bill
    account dropdown, end date, payment ledger, and expected-vs-actual tracking.
    Requires migration 0012.
11. **Export:** done — removed per-tab buttons and added a Settings dataset
    picker/export.
12. **Share to WhatsApp:** done for main entity detail dialogs and task dialogs
    using native share with a `wa.me` fallback.

---

## 9. How to add a typical feature (recipe)

1. **DB:** add columns/tables to a new `supabase/migrations/00NN_*.sql` AND mirror
   into `supabase/schema.sql`. Use `same_household(user_id)` for RLS. Prefer plain
   statements over DO blocks. Paste the SQL inline to the user.
2. **Types:** update `src/lib/database.types.ts` (the `export type` + the
   `Database` Tables map).
3. **Zod schema** (if a form): `src/lib/schemas.ts`.
4. **Server actions:** in the section's `actions.ts` (`"use server"`,
   `getActionContext`, `revalidatePath`).
5. **UI:** detail dialog uses `useOpenFromUrl`; whole-card click uses
   `CardTrigger`; edit form uses react-hook-form + `FormDeleteButton`.
6. `npm run build` → commit → push → PR → merge to `main` (method "merge").
7. **Update this HANDOFF.md.**

---

## 10. Known gotchas / pitfalls

- Don't pass inline arrow functions as props from a Server Component to a Client
  Component — only **server actions** are serializable. (Why restore wrappers
  exist.)
- Dynamic-table Supabase queries need the untyped-client cast (see links actions).
- Radix `DialogTrigger asChild` needs a single focusable child; `CardTrigger`
  provides keyboard handling for a `<div role="button">`.
- Two `DetailDialog` instances for the same id would both auto-open on a deep
  link — render each item's dialog once.
- Archived items are filtered out in pages AND in dashboard/calendar derivations.
- `purchase_stars` / `links` / contributions inserts use `with check
  (auth.uid() = user_id)`; reads use `same_household`.

---

## 11. Current status & possible next steps

- **PR #23 merged to `main`** as merge commit `e62a46f` on 2026-06-25.
- Live migrations **0009**, **0010**, **0011**, **0012**, and **0013** were run
  successfully in Supabase on 2026-06-25. Confirm 0007/0008 only if older
  savings/household features show problems.
- Verification on merged code: `npm run typecheck`, `npm run lint`,
  and the full `npm run build` all pass. The login page now renders a setup
  notice instead of crashing the build when Supabase public environment
  variables are absent (useful for unconfigured previews).
- Ideas not yet requested/built: income/budgeting (explicitly excluded by user),
  notifications/reminders by email, richer analytics, link auto-cleanup on delete,
  showing linked-item counts on cards, assignee avatars.

---

## 12. Maintenance of this document

After every code change, update: section 6 (migrations table + pending list),
section 8 (feature inventory / PR list), section 11 (status), and the "Last
updated" date at the top. Keep it specific enough that a cold-start agent can
continue without re-reading the whole codebase.

### Mandatory continuity protocol

This is a user requirement for every agent (Codex, Claude, or a developer):

1. Update this file **before every commit** with completed work, verification,
   migrations, and the exact next unfinished step.
2. Commit and push every coherent batch. Do not leave completed work only in an
   agent session.
3. Keep the active PR description current when scope changes materially.
4. If context, token, or credit limits may become tight, stop new feature work
   early and create a final pushed handoff checkpoint.
5. A feature is not considered safely handed off until it is committed and
   pushed.

These same rules are mirrored in root `CLAUDE.md` so Claude Code reads them at
the start of future sessions.

### Current in-progress work

PR #23 is merged. Current handoff-only branch: `codex/post-merge-handoff`.

The bills/accounts/payment batch is complete in code and verified with
typecheck/lint. Migration `0012_bill_accounts_payments.sql` must be run after
merge.

The consistency sweep is complete: visible Edit labels on remaining pencil
actions, timestamps on options/accounts/tasks, and task sharing. Typecheck,
lint, and the complete production build pass.

Vercel's first PR deployment (commit `0303eef`) failed because Preview did not
have Supabase public environment variables. The login page is now hardened for
that condition; the fix is verified by a full local production build without
those variables. The replacement Vercel deployment for commit `16698b3` passed.

Migrations 0009–0013 are complete in the live Supabase project. Production
deployment `my-house-dashboard.vercel.app` is Ready.

Next exact step: the user must sign in to the production app in the in-app
browser, then visually test the migrations-backed screens with live household
data. Never ask them to paste credentials or secret keys into chat. No requested
feature from the 2026-06-25 backlog remains intentionally unimplemented.
