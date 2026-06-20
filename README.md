# My House Dashboard

A premium, mobile-first command centre for managing your home — bills, mortgage,
savings, projects, purchases, inspiration, maintenance and documents — built to
feel like a modern personal-finance app rather than a spreadsheet.

Built with **Next.js 15 (App Router)**, **TypeScript**, **Tailwind CSS**,
**shadcn-style UI**, **Recharts**, **Supabase** (Postgres + Auth + Storage),
**React Hook Form + Zod**, **TanStack Table** and **Lucide** icons. Ships as a
**PWA** and is optimised for **Vercel**.

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
states, toast notifications, and a database schema that already supports the
**future AI features** (assistant, cost estimation, idea categorisation).

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

## 🤖 Future AI (schema already in place)

The schema ships with empty tables so AI features need **no migration** later:

- `ai_conversations` / `ai_messages` — the **AI House Assistant** ("What should I
  prioritise?", "How much can I spend on furniture?", "Which renewals are coming up?").
- `ai_cost_estimates` — **AI cost estimation** for projects, purchases and free-text.
- `ai_categorizations` — **AI idea categorisation** for Instagram / TikTok / Pinterest links.

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
