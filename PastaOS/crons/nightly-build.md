# Cron: Nightly Build

## Schedule
Every night at 12:00 AM (midnight), local time

## Target Agent
CTO_Einstein

## Trigger Method
OpenClaw sends a `sessions send` message to the CTO_Einstein session with the nightly build prompt.

## Prompt
```
CTO Einstein — Nightly Build Cycle

It is midnight. Begin your overnight build session.

1. Read your Memory.md for any pending build tasks, feature requests, or bugs logged by COO Pasta or yourself.
2. If there is an active SaaS MVP project:
   a. Pull the latest state from the project workspace.
   b. Implement the next set of features or fixes from the backlog.
   c. Run all tests. Fix any failures.
   d. Write a build report summarizing: what was built, what was tested, what passed/failed, and what remains.
3. If there is no active project:
   a. Log to Memory.md: "No active build project. Nightly build skipped."
4. Persist the build report to Memory.md.
5. Send the build report to COO Pasta via `sessions send`.

End of nightly build cycle.
```

## Expected Output
- Updated codebase in the project workspace
- Build report logged to CTO_Einstein/Memory.md
- Build report sent to COO_Pasta via sessions send

## Notes
- The CTO operates autonomously during the nightly build — no human approval required for code changes during development
- Production deployments still require human operator approval (escalation rule in CTO's Agents.md)
- If the build fails critically, the CTO should escalate to COO Pasta, who will decide whether to wake the human operator
