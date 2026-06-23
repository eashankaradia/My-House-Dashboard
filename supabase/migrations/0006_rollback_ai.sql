-- ===========================================================================
-- 0006 — Roll back AI scaffolding.
--
-- The app no longer ships any AI features, so the empty placeholder tables are
-- removed. This is safe: nothing in the app reads or writes them, and they
-- never held real data. Run this once in the Supabase SQL editor.
-- ===========================================================================

-- Drop child tables first, then parents (CASCADE also handles FK dependents).
drop table if exists public.ai_messages cascade;
drop table if exists public.ai_cost_estimates cascade;
drop table if exists public.ai_categorizations cascade;
drop table if exists public.ai_conversations cascade;
