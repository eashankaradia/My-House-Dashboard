# Agent continuity rules

Read `HANDOFF.md` completely before making changes — start with its "Session
setup" section, which covers the cloud environment to use (the
`My-House-Dashboard` one, not `Default`, or you get no dependencies and no
database access), the fact that all work goes to `main`, and how to apply
migrations. Batches from 2026-07-05 and earlier are in
`docs/handoff-archive/`.

For every coherent implementation batch:

1. Update `HANDOFF.md` before committing. Record what changed, verification
   results, migrations applied, and the exact next unfinished step.
2. Run the appropriate verification (`npm run typecheck`, `npm run lint`, and
   `npm run build` where practical).
3. Apply any new migration yourself via the Supabase MCP connection (project
   `vbyqbxvffaqkrltzewjz`, "My House Dashboard") as part of the same batch —
   do not leave it for the user to run. Then confirm the columns exist with a
   read-only `information_schema` query before calling the feature done.
   Writing a migration file without applying it silently ships a broken
   feature: 0066 and 0067 sat unapplied for weeks that way, which left
   add/edit-purchase erroring in production. Note also that the migration
   ledger is not a reliable check on its own — 0065 had been applied without
   being recorded in it — so always verify the actual columns.
4. Commit and push the batch so work is never left only in an agent session.
5. Keep the active pull request description current when the scope materially
   changes.
6. Before session or credit limits become a risk, stop feature work early and
   leave a final pushed handoff checkpoint.

Never claim a feature is complete unless its code is committed and pushed.
