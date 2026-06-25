# Agent continuity rules

Read `HANDOFF.md` completely before making changes.

For every coherent implementation batch:

1. Update `HANDOFF.md` before committing. Record what changed, verification
   results, migrations the user must run, and the exact next unfinished step.
2. Run the appropriate verification (`npm run typecheck`, `npm run lint`, and
   `npm run build` where practical).
3. Commit and push the batch so work is never left only in an agent session.
4. Keep the active pull request description current when the scope materially
   changes.
5. Before session or credit limits become a risk, stop feature work early and
   leave a final pushed handoff checkpoint.

Never claim a feature is complete unless its code is committed and pushed.
