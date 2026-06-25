# My House Dashboard — Engineering Handoff

> **Purpose of this file:** a complete, self-contained briefing so another AI
> agent (or developer) can pick up exactly where work left off. Keep it updated
> after **every** change. Last updated: 2026-06-25 (Codex continuation batch).

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
- **Outstanding user actions:** run migrations **0009**, **0010**,
  **0011**, **0012**, and **0013** (and confirm 0008/0007 are run).
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

Next exact step: run migrations 0009–0013 in order in the live Supabase project,
then visually test the migrations-backed screens with live household data. The
user should open the logged-in Supabase SQL Editor in the in-app browser; never
ask them to paste credentials or secret keys into chat. No requested feature
from the 2026-06-25 backlog remains intentionally unimplemented.
