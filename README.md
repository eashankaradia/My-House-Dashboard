# My House Dashboard

A premium, mobile-first command centre for managing your home — bills, mortgage,
savings, projects, purchases, inspiration, maintenance and documents — built to
feel like a modern personal-finance app rather than a spreadsheet.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**shadcn-style UI**, **Recharts**, **Supabase** (Postgres + Auth + Storage),
**React Hook Form + Zod**, **TanStack Table** and **Lucide** icons. Ships as a
**PWA** and is optimised for **Vercel**.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Feashankaradia%2FMy-House-Dashboard&env=NEXT_PUBLIC_SUPABASE_URL,NEXT_PUBLIC_SUPABASE_ANON_KEY,NEXT_PUBLIC_SITE_URL&envDescription=Supabase%20Project%20URL%2C%20anon%20key%2C%20and%20your%20deployed%20site%20URL&envLink=https%3A%2F%2Fgithub.com%2Feashankaradia%2FMy-House-Dashboard%2Fblob%2Fmain%2F.env.example)

---

## ⚡ Deploy in ~5 minutes

> The one-click button above deploys the repo's **default branch** to Vercel and
> prompts for the three env vars. Before clicking, do steps 1–2 so you have the
> values ready. (If this code is still on a feature branch, merge it into `main`
> first so the button picks it up.)

**1. Create the database (Supabase) — ~2 min**
   1. Make a free project at <https://supabase.com>.
   2. **SQL Editor → New query** → paste all of [`supabase/schema.sql`](supabase/schema.sql) → **Run**. ✅ Creates every table, RLS policy, trigger and storage bucket.
   3. **Settings → API** → copy the **Project URL** and **anon public** key.

**2. (Optional) Turn on Google login — ~2 min**
   The app also supports **passwordless email sign-in out of the box** (no setup
   needed — Supabase's built-in email sender handles it), so you can skip this and
   come back later. To add Google:
   1. In **Google Cloud Console → Credentials**, create an **OAuth 2.0 Client ID** (Web app).
   2. Add **Authorized redirect URI**: `https://<your-project-ref>.supabase.co/auth/v1/callback`.
   3. In **Supabase → Authentication → Providers → Google**, enable it and paste the Client ID + Secret.

**3. Deploy — ~1 min**
   1. Click **Deploy with Vercel** above (or import the repo at <https://vercel.com/new>).
   2. When prompted, paste **two** env vars:
      - `NEXT_PUBLIC_SUPABASE_URL` = your Project URL
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = your anon key
      - `NEXT_PUBLIC_SITE_URL` is **optional** — the app uses the browser origin automatically, so you can skip it.
   3. **Deploy.**

**4. Point auth at your live URL — ~30 sec**
   - In **Supabase → Authentication → URL Configuration**, set **Site URL** to your Vercel URL and add it to **Redirect URLs**. Sign in with Google — done. 🎉

> Detailed walkthrough (local dev, service-role key, security model) is in the
> sections below.

---

## ✨ Features

| Module | What it does |
| --- | --- |
| **Dashboard** | Command centre: financial summary, savings progress, open projects, renewal reminders, upcoming maintenance, recent inspiration & purchases, and quick-add actions. |
| **Bills & Expenses** | Recurring costs with monthly/annual calculations, category donut chart, upcoming & overdue tracking. |
| **Mortgage** | Equity, loan-to-value, remaining term, an interactive **overpayment calculator** with payoff projection chart, and a remortgage countdown. |
| **Savings Pots** | Virtual pots with targets, monthly contributions, progress bars, forecast completion dates and quick +/- adjustments. |
| **Projects** | Kanban **board**, **list** and **cost** views; estimated vs actual costs; idea → completed workflow. |
| **Future Purchases** | Wishlist with links, prices, rooms, priority and status; sort & filter; purchased history. |
| **Inspiration Hub** | Pinterest-style **masonry / card / list** views, collections, tags, search/filter, and **convert → Project / Purchase** smart actions. |
| **Maintenance** | Recurring tasks with auto-calculated next-due dates, overdue tracking and one-tap "mark done". |
| **Documents** | Secure file uploads to Supabase Storage, categorisation, expiry/renewal reminders, signed-URL downloads. |
| **Analytics** | Recharts breakdowns: spending by category, projected outgoings, project costs, savings, maintenance and wishlist value. |

Plus: dark/light mode, desktop sidebar + mobile drawer nav, loading/empty/error
states, toast notifications, a household **change log** of who changed what, and
**Tasks** living alongside Projects (standalone or tied to a project, with
add-to-calendar).

The app starts **completely empty** — no seed data. You build everything from
scratch.

---

## 🗂 Folder structure

```
.
├─ supabase/
│  └─ schema.sql                 # Complete DB schema: tables, RLS, triggers, storage
├─ public/
│  └─ icons/icon.svg             # App / PWA icon
├─ src/
│  ├─ middleware.ts              # Auth session refresh + route guarding
│  ├─ app/
│  │  ├─ layout.tsx              # Root layout (fonts, theme, toaster)
│  │  ├─ globals.css             # Design tokens (light/dark) + masonry
│  │  ├─ manifest.ts             # PWA manifest
│  │  ├─ page.tsx                # Redirects to /dashboard or /login
│  │  ├─ login/                  # Google sign-in screen
│  │  ├─ auth/                   # OAuth callback + signout route handlers
│  │  └─ (app)/                  # Authenticated app shell (sidebar + topbar)
│  │     ├─ layout.tsx
│  │     ├─ loading.tsx · error.tsx
│  │     ├─ dashboard/  bills/  mortgage/  savings/  projects/
│  │     ├─ purchases/  inspiration/  maintenance/  documents/  analytics/
│  │     │  └─ each module: page.tsx + *-form.tsx + actions.ts (+ views)
│  ├─ components/
│  │  ├─ ui/                     # shadcn-style primitives (button, card, dialog…)
│  │  ├─ charts/                 # Recharts wrappers (donut, bar, area)
│  │  ├─ layout/                 # sidebar-nav, mobile-nav, user-menu
│  │  └─ shared/                 # page-header, stat-card, empty-state, confirm-delete…
│  ├─ hooks/use-toast.ts
│  └─ lib/
│     ├─ supabase/{client,server,middleware}.ts
│     ├─ database.types.ts       # Typed schema for the Supabase client
│     ├─ schemas.ts              # Zod validation
│     ├─ constants.ts · utils.ts · finance.ts · ui.ts · action-utils.ts
└─ .env.example
```

---

## 🚀 Getting started (local)

### 1. Prerequisites
- Node.js 18.18+ (Node 22 recommended)
- A free [Supabase](https://supabase.com) project
- A Google Cloud OAuth client (for Google login)

### 2. Install
```bash
npm install
```

### 3. Set up Supabase
1. Create a project at <https://supabase.com>.
2. Open **SQL Editor** → paste the contents of [`supabase/schema.sql`](supabase/schema.sql) → **Run**.
   This creates every table, row-level-security policy, trigger, and the
   `documents` (private) and `images` (public) storage buckets.
3. Go to **Settings → API** and copy your **Project URL** and **anon public** key.

### 4. Configure Google login
1. In **Google Cloud Console → APIs & Services → Credentials**, create an
   **OAuth 2.0 Client ID** (Web application).
2. Add an **Authorized redirect URI**:
   `https://<your-project-ref>.supabase.co/auth/v1/callback`
3. In **Supabase → Authentication → Providers → Google**, enable it and paste the
   Client ID and Client Secret.
4. In **Supabase → Authentication → URL Configuration**, set the **Site URL**
   (e.g. `http://localhost:3000` locally, your Vercel URL in production) and add
   both to **Redirect URLs**.

### 5. Environment variables
Copy the example and fill it in:
```bash
cp .env.example .env.local
```
```dotenv
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
# Optional, server-only:
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 6. Run
```bash
npm run dev
```
Open <http://localhost:3000> and sign in with Google.

---

## ☁️ Deploy to Vercel

1. Push this repo to GitHub.
2. In [Vercel](https://vercel.com), **Import** the repository (framework auto-detects Next.js).
3. Add the environment variables under **Settings → Environment Variables**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` → your production URL, e.g. `https://my-house.vercel.app`
   - `SUPABASE_SERVICE_ROLE_KEY` (optional)
4. **Deploy.**
5. Back in **Supabase → Authentication → URL Configuration**, add your Vercel URL
   to the **Site URL** / **Redirect URLs** so Google OAuth redirects work in prod.

`vercel.json` is included with the correct build/dev/install commands.

---

## 🔐 Security model

Every domain table carries a `user_id` and is protected by **row-level security**
so a user can only ever read or write their own rows. Document files live in a
**private** storage bucket scoped to a per-user folder (`<uid>/…`) and are served
via short-lived signed URLs. The app is single-user today but multi-tenant-ready.

---

## 📜 Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript, no emit |

---

Built to be production-ready, clean and scalable — adding a new module is just a
new folder under `src/app/(app)/` with a `page.tsx`, an `actions.ts`, a form and
a nav entry in `src/lib/constants.ts`.
