# MyLife — Engineering Handoff

> **Purpose of this file:** a complete, self-contained briefing so another AI
> agent (or developer) can pick up exactly where work left off. Keep it updated
> after **every** change. Last updated: 2026-11-22 (Future Purchases: new
> Rooms view + simpler list and toolbar). User asked: "Make my future
> purchases interface easier to use. Give me a view where I have all of my
> rooms as collapsible sections and can see the purchases behind it. Make the
> purchase view simple." Three changes, all in the Future Purchases UI (no
> schema change, no migration): (1) a new `"rooms"` view mode — added to
> `ViewMode` in `src/hooks/use-view-prefs.ts` and made the **default** for
> the purchases section (was `"compact"`), plus a "Rooms" option in the
> Settings view picker (`src/app/(app)/settings/view-defaults.tsx`) and a
> `DoorOpen` button in the on-page view toggle. It renders one
> `RoomSection` per room from `useRooms()` (the household's editable room
> list, so empty rooms show too), each a collapsible card headed "Room · N
> items · £total", with a `No room yet` bucket last and rooms sorted
> alphabetically. (2) A new `SimpleRow` for the rows inside those sections:
> name, a muted "category · N options" line, a "Nice-to-have" pill for
> non-essential items, and the effective price — tapping anywhere opens the
> existing `PurchaseDetailDialog`, which already holds status/edit/options/
> delete, so no per-row control clutter. (3) Decluttered the toolbar: the
> five desktop `NativeSelect` filters and the two desktop toggle buttons are
> gone, so the Filters sheet is now the single filter surface at every
> breakpoint (it gained "Added by" and, on MyLife, "Scope" segmented
> controls), the removable filter chips show at all widths, and the visible
> bar is just Search / Filters / Sort / count / view toggle. Sections
> auto-expand while a search or filter is narrowing (`narrowing` flag keyed
> into `RoomSection`'s remount), otherwise the first room starts open.
> Shared component — applies to both My House and MyLife. `npm run
> typecheck`, `npm run lint`, default build, and `NEXT_PUBLIC_APP=life`
> build all pass. Not browser-verified against live data (no `.env.local`
> Supabase credentials in this sandbox) — smoke-test: open `/purchases`,
> confirm it lands on the Rooms view with every room listed, expand a couple
> of rooms, check the per-room totals look right, tap an item to confirm the
> detail dialog still does everything, then try the Filters sheet and the
> other three views. Both apps confirmed READY on Vercel production for
> commit `fd6afcb`. **Migration backlog found and cleared in the same
> session:** 0066 and 0067 had never been applied to the live DB, which meant
> add/edit-purchase was erroring in production (`toRow()` writes
> `is_essential` to a column that didn't exist) and every Rooms-view row
> showed a "Nice-to-have" pill (undefined read as falsy). Both are now
> applied via the Supabase MCP connection and the columns verified; `CLAUDE.md`
> rule 3 now requires applying and verifying migrations in the same batch.
> Earlier sections
> (essential filter, Shopping List rename, MyLife dashboard leak fix, global
> masking coverage, mask-toggle header placement, favicon alignment,
> currency rounding, and everything before) are all already confirmed
> deployed.

## Session setup — read this first (2026-11-22)
Three things that cost every previous session time or correctness:

**1. Use the `My-House-Dashboard` cloud environment**, not `Default`.
(`env_01BQ7h3czxfRdUaTiviWyt78`, personal, saved for this repo — pick it in
the environment menu when starting a session.) It carries
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` and
`NEXT_PUBLIC_SITE_URL` as environment variables, allows the
`vbyqbxvffaqkrltzewjz.supabase.co` host, and runs `npm install` in a setup
script so the checkout is ready to build on arrival. On `Default` you get
none of that: no `node_modules` (≈3 min to install) and no network route to
Supabase, so `npm run dev` can't reach the database and nothing can be
browser-verified. Every batch before 2026-11-22 shipped unverified in a
browser for exactly this reason — if you're on the right environment, run
the app and actually look at the change.

**2. All work goes to `main`.** Sessions keep starting checked out on
`claude/mylife-personal-os-m6octr`, which is ~57 commits behind and is NOT
where anything is deployed from. Switch first:
`git checkout main && git merge --ff-only origin/main`. Vercel deploys
`main` directly to both production projects; there is no PR workflow here.

**3. Apply your own migrations** — see `CLAUDE.md` rule 3. Use the Supabase
MCP connection, project `vbyqbxvffaqkrltzewjz` ("My House Dashboard"), and
verify the columns with `information_schema` afterwards. Do not trust
`list_migrations`: it under-reports (0065 is absent from it but applied).

Deployment targets, for reference: `my-house-dashboard`
(`prj_BOUIdAM8EEfh6JI9nrql8K7e67Qb`) and `my-life-dashboard`
(`prj_TB7Dt9AVg88kp0AX5TXrhXqhsnhx`), team
`team_jJ3EVwt72NA4LhbenZnWfT88`. One codebase, two branded Vercel projects
switched by `NEXT_PUBLIC_APP=house|life`, sharing one Supabase database.

## Future Purchases: Rooms view + simpler list and toolbar (2026-11-22)
User said: "Make my future purchases interface easier to use. Give me a view
where I have all of my rooms as collapsible sections and can see the
purchases behind it. Make the purchase view simple." No schema change and no
migration — this is all presentation.

### 1. New "Rooms" view (now the default)
- `src/hooks/use-view-prefs.ts` — `ViewMode` gains `"rooms"`, and
  `DEFAULT_VIEW.purchases` changes from `"compact"` to `"rooms"`. Note the
  stored pref is per-device, so anyone who had already picked a view keeps
  it and has to select Rooms from the toggle once.
- `src/app/(app)/settings/view-defaults.tsx` — "Rooms" added as the first
  purchases option so the Settings picker and the on-page toggle still agree.
- `purchases-grid.tsx` — a `DoorOpen` button in the view toggle, and a new
  `RoomSection` component: a `Card` with a header button showing the room
  name, item count and the room's total (summed `effectivePrice`), a
  `ChevronDown` that rotates when open, and the rows revealed underneath.
  Room names come from `useRooms()` (the household's editable list) unioned
  with any room names found on existing purchases, sorted alphabetically,
  with a `NO_ROOM` ("No room yet") bucket appended when anything is
  unassigned. **Only rooms that actually contain items get a section** — see
  the data check below for why — and the leftovers collapse into one muted
  "Nothing planned yet in X, Y, Z." line, hidden entirely while a
  search/filter is narrowing.

#### Data check that changed this design
Queried the live DB rather than guessing: the household has **20 distinct
configured rooms but only 7 with active wishlist items** (20 items total,
4 of them unassigned). The first cut gave every configured room its own
section, which would have rendered 21 sections for 20 items with 13 of them
empty — strictly worse than the list it replaced. If you touch this view,
re-check that ratio before reintroducing empty sections. Also confirmed no
purchase has a null `price`, so the per-room `effectivePrice` totals can't
produce `£NaN`.
- Open/closed behaviour: `defaultOpen={narrowing || i === 0}`, and the
  section `key` includes `narrowing` so the sections remount (and so
  re-derive their open state) the moment a search/filter starts or stops
  narrowing. That means searching expands every matching room with no extra
  clicks, and a clean page still shows the first room's contents instead of
  a wall of closed rows.

### 2. Simpler purchase rows
New `SimpleRow` in `purchases-grid.tsx`, used inside the room sections:
priority accent border (`PRIORITY_ACCENT`), item name, a muted
"category · N options" sub-line, a "Nice-to-have" pill when
`is_essential` is false, and the effective price. The whole row is a
`CardTrigger` that opens `PurchaseDetailDialog` — which already carries the
status select, edit form, option ranking, comments and delete — so nothing
is lost by keeping those controls out of the list. Contrast with
`CompactRow` (still used by the compact view and the Purchased section),
which carries an inline status dropdown, edit pencil and delete button.

### 3. Decluttered toolbar
Previously the desktop bar carried an only-mine toggle, a scope toggle, two
binary filter buttons, five `NativeSelect` dropdowns, the sort select, the
count and the view toggle — all on one wrapping row. Now:
- The Filters `Sheet` is the single filter surface at every breakpoint (its
  trigger lost `lg:hidden`), and it gained "Added by" (Everyone/Me) and, on
  MyLife only, "Scope" (All/Household/Personal) segmented controls via two
  small new helpers, `FilterGroup` and `SegmentedButton`.
- The five desktop `NativeSelect`s and the two desktop toggle buttons were
  deleted — they only duplicated what the sheet already had.
- The removable filter chips lost `lg:hidden`, so what's active is visible
  and clearable at any width; `onlyMine` and `scopeFilter` now produce chips
  too.
- What's left on the visible bar: search, the Filters button (with its
  active-filter count badge), the chips, the sort select, the item count and
  the view toggle.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-tested against live data
(no Supabase credentials in this sandbox).

### Migration backlog found and cleared (same session)
Audited the live DB against `supabase/migrations/` and found two files had
never been applied, which had silently broken two shipped features:
- **0067** (`purchases.is_essential`) — `toRow()` writes `is_essential` on
  every create/update, so **adding or editing any purchase was failing in
  production** with a PostgREST "column does not exist" error, and every
  Rooms-view row rendered a "Nice-to-have" pill because `undefined` reads as
  falsy. Applied and verified.
- **0066** (`room_design_layout_items.corner`, `notch_w_cm`, `notch_d_cm`) —
  the Room Designer corner-sofa feature had no columns to persist to.
  Applied and verified.

Both applied via the Supabase MCP connection (project `vbyqbxvffaqkrltzewjz`)
and confirmed with an `information_schema` query: `is_essential` is
`boolean NOT NULL DEFAULT true` (existing rows backfilled to `true`, i.e.
everything is Essential until marked otherwise), and the three layout columns
are nullable `text`/`numeric`/`numeric`.

**Important lesson for future sessions:** the Supabase migration ledger
(`list_migrations`) is NOT a reliable check — 0065 does not appear in it but
its column does exist, so it had been applied without being recorded. Always
verify the actual columns via `information_schema`, not the ledger.
`CLAUDE.md` rule 3 now requires applying and verifying migrations as part of
the batch that introduces them.

### Known data issue, not yet fixed — duplicate rooms
`public.rooms` contains 26 rows but only 20 distinct names: **Garage,
Garden, Hallway, Kitchen, Living Room and Office each appear twice**,
probably from a seed or migration applied twice. The Rooms view is immune
(it dedupes with a `Set`), but the room dropdowns in `purchase-form.tsx` and
`inspiration-form.tsx` will show those names twice. Not cleaned up because
`rooms` rows carry ids referenced elsewhere (`/rooms/[id]`, the room
designer tables), so deleting a duplicate could orphan a saved design —
needs a careful look at which id is referenced before any delete. Raised
with the user 2026-11-22; awaiting a decision.

**Next step:** nothing outstanding in code. Two things need the user:
(1) a decision on the duplicate `rooms` rows above, and (2) a browser
smoke-test of the Rooms view — or a test login so a session on the
`My-House-Dashboard` environment can do it. Now that 0067 is live, every
existing purchase is `is_essential = true`, so no "Nice-to-have" pills
should appear until something is explicitly marked as one.

## Future Purchases: Essential/Nice-to-have flag + filter (2026-10-05)
User said: "On future purchases make give me a radio button which lets me
filter out non essential purchases." No existing field fit: `priority`
(Low/Medium/High) is a distinct urgency ranking, and the separate
MyLife-only `essentials` table (the "Essentials" page) is an unrelated
feature — so this needed a new boolean on `purchases`.

**Migration required — run before/with this deploy:**
`supabase/migrations/0067_purchase_essential.sql` adds `is_essential
boolean not null default true` to `purchases`. Defaulting to `true` means
every existing item stays visible under the new filter until someone
explicitly marks it a nice-to-have.

Code changes:
- `src/lib/database.types.ts` — `Purchase.is_essential: boolean`.
- `src/lib/schemas.ts` — `purchaseSchema.is_essential: z.boolean().default(true)`.
- `src/app/(app)/purchases/actions.ts` — `toRow()` passes `is_essential`
  through on create/update.
- `src/app/(app)/purchases/purchase-form.tsx` — new "Essential?" field: a
  two-button segmented toggle (Essential / Nice-to-have) using
  `watch`/`setValue`, since native `<select>` + `register` doesn't suit a
  boolean. Defaults to Essential for new items.
- `src/app/(app)/purchases/purchases-grid.tsx` — new `essentialOnly` state,
  a binary toggle button (styled like the existing `hideNoOptions` control,
  present in both the mobile `Sheet` and the desktop toolbar), a
  `.filter((p) => !essentialOnly || p.is_essential)` clause, and an
  "Essential only" chip in the mobile `activeFilters` list.

This is a shared component used by both apps' `/purchases` route, so it
applies to My House and MyLife without any app-specific gating — matching
how the user's request wasn't scoped to one app.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-tested against live data
(no Supabase credentials in this sandbox).

**Next step:** run migration `0067_purchase_essential.sql` against the live
Supabase project, then confirm in the browser: mark an item "Nice-to-have",
toggle "Essential only" in `/purchases` and confirm it's filtered out on
both My House and MyLife.

**Deploy confirmed:** both `my-house-dashboard` and `my-life-dashboard`
production deployments for commit `a31aa1c` are READY on Vercel. The
migration still needs to be run against the live Supabase DB — see "Next
step" above.

## My House: rename "Groceries" to "Shopping List" (2026-09-18)
User said: "on my house change groceries to a general shopping list." The
`/shopping` feature was already functionally generic — an item is just a
free-text name + optional quantity (`shopping_items` table), with no
grocery-specific fields, categories, or copy anywhere in
`shopping-list.tsx`'s UI (empty state, placeholders, "Got it" flow all
already read as a general list). This was a pure branding/copy change, not
a feature change.

Changed:
- `src/lib/constants.ts` — the My House nav item's `title`: "Groceries" →
  "Shopping List". Kept `short: "Shop"` (the bottom-tab label) and the
  `ShoppingCart` icon as-is — both already read as generic.
- `src/app/(app)/shopping/page.tsx` — `metadata.title` and the
  `PageHeader` title to match. Also tweaked the info-hint text to add
  "Add anything you need to pick up — not just groceries" so the page
  itself signals the broadened scope, not just the nav label.

Confirmed via a repo-wide case-sensitive grep for "Groceries" that it
appeared nowhere else except MyLife's `BUDGET_CATEGORIES` list ("Food &
Groceries" — a personal spending category in the MyLife-only Finance
feature, unrelated to this nav item) — left untouched, since the request
was specifically about My House and that's a different concept entirely.
`shopping_items`'s table/column names were already generic (`name`,
`quantity`, `is_got`, `got_at`) — no migration needed.

Session note: started in a fresh sandbox checked out on the stale
`claude/mylife-personal-os-m6octr` branch (from an early task-setup
instruction, far behind `main` — missing all of this session's prior
work). Switched to `main` (`git checkout main && git merge --ff-only
origin/main`, clean fast-forward, no local changes lost) before starting,
since `main` is what's actually deployed and where `HANDOFF.md`'s history
lives. `node_modules` was also missing (fresh sandbox) — ran `npm install`
before verification.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-verified against live
data (no `.env.local` Supabase credentials in this sandbox).

## Dashboard: stop MyLife content leaking onto My House home (2026-07-06)
User said: "on myhouse home don't show anything from mylife." Audited
`src/app/(app)/dashboard/page.tsx` (the one dashboard component both apps
share, switched only by which widgets render and what's queried) for
anything that could show MyLife-only data on My House.

**Unconditional queries for MyLife-only features**: `habits`, `habit_logs`,
`goals`, and `income_months` were all queried with no `isHouse`/`isLife`
check. None of these four have any nav entry, page, or feature on My House
(`HOUSE_NAV_ITEMS` in `lib/constants.ts` has no Habits, Routine, Goals, or
Finance/Income item — those are MyLife-only). The "Today's habits" widget,
"Goals" widget, and "Cash flow" widget (which shows income vs bills) were
each gated only on the fetched data being non-empty (`dailyHabits.length >
0`, `activeGoals.length > 0`, `netMonthly !== null`), so if that data
existed for the account they'd render on My House with no feature there to
have produced it "properly" — a latent leak, not yet necessarily hit in
practice, but present in the code. Changed all four queries to the same
conditional-query pattern already used for `weeklyReviewQuery`
(`isLife ? supabase.from(...) : Promise.resolve({ data: null })`), so
nothing is fetched on My House and the widgets disappear via their
existing empty-data guards — no new `isLife &&` JSX checks needed.

**Unscoped projects/tasks**: `bills` and `purchases` both have a
`scope: "personal" | "household"` column and were already filtered to
`.eq("scope", "household")` on My House everywhere, including the
dashboard. `projects` and `project_tasks` have the same `scope` column
(confirmed in `database.types.ts`) and every other page that reads them
(`projects/page.tsx`) applies the same filter — but the dashboard's own
queries for `projects` and `project_tasks` had no scope filter at all.
That meant a personal (MyLife) project or task could appear in the
dashboard's "Open projects", "Upcoming tasks", and "Needs attention"
sections, and inflate the `openTasks`/`activeProjects`/`dueThisWeek`
glance-stat counts, on My House. Added the same `.eq("scope",
"household")` filter used for bills/purchases.

**Pinned favourites**: a narrower, second-order leak — `getPinnedItems()`
(`src/app/(app)/favorites/actions.ts`) resolves every favourite the
current Supabase account has ever starred, across both apps, since
favourites are keyed by `user_id` with no app/scope awareness. A "goal"
favourite (MyLife-only, no My House equivalent) or a personal-scope "task"
favourite would still resolve to a label and appear in My House's Pinned
widget if starred while using MyLife under the same account. Fixed by
skipping the "goal" type entirely on My House, and by selecting each
task's `scope` column and skipping personal ones when resolving labels on
My House.

Deliberately unchanged: `maintenance_tasks`, `documents`, and `mortgages`
are queried unconditionally too, but these have no nav entry or feature on
MyLife at all (the reverse direction), so there's no plausible way MyLife
data ends up in those tables to leak — out of scope for "don't show
anything from MyLife on My House."

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-verified against live
data (no `.env.local` Supabase credentials in this sandbox).

## Global masking coverage: every currency display, not just Finance (2026-07-06)
User said: "global masking should hide all finance numbers" — after the
previous batch added a header-level toggle, the toggle itself worked but
only actually masked amounts on the Finance page and dashboard glance
stats (the only places already using `<Money>`). Everywhere else — bills,
purchases, savings pots, projects, room designer, mortgage, maintenance,
analytics, goals, reviews, and chart tooltips/axis labels — called
`formatCurrency()` directly, bypassing the mask entirely.

Audited every `formatCurrency(`/`formatCompactCurrency(` call site across
the app (~100 sites in 31 files) and classified each as: a plain JSX
display (swap to `<Money value={...} />`), a component prop typed as
`string` (widen to `React.ReactNode` so `<Money>` fits), or a non-JSX
string context — Recharts `tickFormatter`/`Tooltip.formatter` callbacks
and `ShareButton`'s `text` prop — where `<Money>` (a component) can't be
used, so those call `useMaskFinance()` directly and substitute
`MASKED_AMOUNT` from `lib/mask-money-text.ts` when masked.

Files touched: `bills/{bill-contributors,household-contributions,bills-list,
bill-detail,bill-payments,page}.tsx`, `purchases/{purchases-grid,
option-detail,option-row,purchase-detail,page,ready-to-buy}.tsx`,
`savings/{pot-detail,pot-card,page}.tsx`, `projects/{projects-views,
project-detail}.tsx`, `rooms/room-workspace.tsx`, `rooms/[id]/compare/
page.tsx`, `maintenance/{maintenance-row,maintenance-detail,page}.tsx`,
`mortgage/{overpayment-calculator,page}.tsx`, `analytics/page.tsx`,
`goals/page.tsx`, `reviews/page.tsx`, `components/charts/{bar-chart,
area-chart,donut-chart}.tsx`, and `components/shared/stat-card.tsx`
(widened `value`/`hint` to `ReactNode`). `finance/salary-details.tsx` was
already correctly masking via its own inline ternary — left unchanged.
Every edit form's raw number inputs remain untouched, as established in
the currency-rounding batch.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-verified against live
data (no `.env.local` Supabase credentials in this sandbox).

## Global mask-finance toggle + favicon alignment (2026-07-06)
User asked for two things in one message: (1) "give me a toggle at the
top which lets me mask financial figures on and off. do this on myhouse
and mylife" — the mask-finance feature already existed (task #78) but its
toggle button was only present on the Finance page, not "at the top"
app-wide; (2) "align all of the logos" — ambiguous, so asked via
AskUserQuestion whether this meant the favicon vs in-app logo mismatch or
the sizing/rounding/shadow inconsistency across the 3 places the logo
image appears; user picked the favicon/in-app-logo mismatch.

**Toggle**: `MaskFinanceToggle` (`src/components/shared/mask-finance-
toggle.tsx`) and its backing `useMaskFinance` hook (per-device pref,
`src/hooks/use-mask-finance.ts`) already existed and already drove
`<Money>` masking app-wide — the only gap was discoverability. Added it
to the shared top header in `src/app/(app)/layout.tsx` (next to search,
notifications, private-section link), which both My House and MyLife
render from since it's one shared layout switched only by
`NEXT_PUBLIC_APP`. Removed the duplicate instance from
`src/app/(app)/finance/page.tsx`'s `PageHeader` now that it's globally
reachable. Added a `variant?: "outline" | "ghost"` prop to
`MaskFinanceToggle` (default `"outline"`, unchanged for any future
in-page use) so the header instance can use `"ghost"` to match the
borderless style of the other header icon buttons (search, bell,
private-lock) instead of standing out as a bordered button.

**Favicon**: `public/icons/icon.svg` (wired to both `icon` and `apple` in
`src/app/layout.tsx` metadata) still had the pre-redesign look — solid
green `#24a371` rounded-square background, thin white M chevron, tiny
white corner sparkle. Meanwhile the actual in-app logo
(`public/icons/logo.png`, shown in the sidebar, mobile header, and login
page) was already on the redesigned cream/sage-green sparkle mark. Used
Pillow to sample `logo.png`'s exact pixel colors (background `#faf9f7`,
mark `#7c9a7f`), then rebuilt `icon.svg` with those colors, a bolder
stroke-width-3 M (up from 1.7, to read as "bold" like the PNG rather than
a thin outline), and a repositioned/rescaled sparkle. Rendered the new
SVG through headless Chromium (`/opt/pw-browsers/chromium-1194`, no
`playwright` npm package installed in this repo so invoked the chrome
binary directly with `--headless=new --screenshot`) and visually
diffed it against `logo.png` side by side to confirm the match before
finalizing. `public/icons/icon.png` (referenced by `src/app/manifest.ts`
for PWA home-screen icons) was already byte-identical to `logo.png`
(confirmed via `md5sum`), so it didn't need touching — the mismatch was
isolated to the SVG favicon.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-verified against live
data (no `.env.local` Supabase credentials in this sandbox).

## App-wide: round currency to the nearest pound (2026-07-06)
User asked: "round financial numbers to the nearest pound at first
glance, keep the actual numbers in the background." Asked the user to
pick between (a) rounding everywhere with the exact figure only
reachable via each item's edit form, or (b) a hover/tap-to-reveal tooltip
on every currency display; they chose (a) — simpler and works better on
a mobile-first app where hover tooltips aren't reliably reachable anyway.

`formatCurrency()` in `src/lib/utils.ts` was the single shared formatter
(confirmed via grep: all ~113 call sites across the app call it with no
options, so none were relying on the old conditional-pence behavior).
Old behavior: `maximumFractionDigits: amount % 1 === 0 ? 0 : 2` — whole
pounds only when the amount happened to be a round number, pence
otherwise. New: always `maximumFractionDigits: 0`. This one-line change
cascades everywhere `formatCurrency` (or the `<Money>` mask-aware
wrapper, which calls it) is used — stat cards, list rows, dashboard
widgets, detail dialogs, chart tooltips, everything.

Deliberately unchanged: every edit form (bills, purchases, projects,
shares, savings, credit cards, etc.) binds its amount field to the raw
stored number via a plain `<Input type="number">`, never through
`formatCurrency` — so the exact pence figure was never lost, just not
shown in read-only summary text. Opening any item to edit it still shows
the precise number exactly as stored.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-verified against live
data (no `.env.local` Supabase credentials in this sandbox).

## Bills: fix pays-the-rest split ignoring future-dated contributors (2026-07-06)
User reported: "the pays the rest option on bills needs to be the
difference between the total and the amount that others pay." Several
rounds of investigation (the formula itself — `max(0, total − fixed) /
remainder count` — was already correct) eventually landed on a
screenshot: the household had Neelam at £900/mo starting 1 Aug 2026, and
Eashan "Pays the rest," but Eashan's shown amount was the full monthly
total, not total-minus-900.

Root cause: both `household-contributions.tsx` and `bill-contributors.tsx`
had an `isActive(c, today)` check (`start_date <= today <= end_date`) used
to build the set that feeds the sum (`fixed`/`remainder`/`fixedTotal`),
but the rendered row list mapped over the *unfiltered* array. So a
future-dated fixed contribution (start_date in the future) displayed its
£ amount in its own row like normal, while being silently dropped from the
arithmetic feeding everyone else's "pays the rest" figure — a genuine
display/calc inconsistency, not just a data-entry mistake.

Fix (identical in both files):
- Replaced `isActive()` with `isExpired(c, today)` — `true` only when
  `end_date` is set and in the past. A future `start_date` no longer
  excludes a row from the split math, since a scheduled-to-start
  contribution is still the agreed number, not a "maybe."
- `fixed`/`remainder`/`fixedTotal`/`remainderEach` now derive from
  `counted = contributions.filter(c => !isExpired(c, today))` instead of
  the old `active` (both-bounds-checked) set.
- Per-row label: replaced the binary "· not active" with "· ended" when
  `isExpired` (genuinely excluded) and "· starts soon" when the start
  date is still in the future (included, just not live yet) — so the
  label now matches what's actually happening in the math.
- The "≈ effective amount" preview line now gates on `!expired` instead
  of the old `live` flag, so it still shows for future-dated rows (since
  they're now counted) and hides only for genuinely expired ones.

Deliberately not changed: a contributor with BOTH a past and a future
entry (e.g. an old £700 row ended, superseded by a new £900 row) could
still double-count if both happen to be "not expired" at once with
overlapping dates — this wasn't the user's scenario (single row per
person) and handling staggered/overlapping schedules properly would need
a bigger redesign (e.g. "most relevant row per member") not requested here.

Verification: `npm run typecheck`, `npm run lint`, default build, and
`NEXT_PUBLIC_APP=life` build all pass. Not browser-verified against live
data (no `.env.local` Supabase credentials in this sandbox).

## Older batches (archived)
Everything from 2026-07-05 and earlier lives in
`docs/handoff-archive/HANDOFF-2026-07-05-and-earlier.md` — including the
architecture/stack reference, the data-model notes and the full batch
history. It was split out on 2026-11-22 because this file had reached 4,400
lines, which made `CLAUDE.md`'s "read `HANDOFF.md` completely" rule
impossible to follow honestly. Read the archive when working in an area this
file does not cover.
