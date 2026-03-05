# Cron: Self-Improvement Cycle

## Schedule
Every night at 11:00 PM, local time (runs before the nightly build at midnight)

## Target Agents
All agents, triggered individually:
- COO_Pasta
- CTO_Einstein
- CMO_Gary
- CRO_Marcus
- Family_Assistant

## Trigger Method
OpenClaw sends a `sessions send` message to each agent session with the self-improvement prompt.

## Prompt (sent to each agent)
```
[Agent Name] — Nightly Self-Improvement Cycle

It is 11:00 PM. Begin your self-improvement review.

Phase 1: Memory Scan
1. Read your entire Memory.md file.
2. Identify patterns, recurring themes, lessons learned, and new knowledge gained since the last self-improvement cycle.

Phase 2: Soul Reflection
3. Read your current Soul.md.
4. Based on your Memory.md analysis, determine if any personality traits, values, or behavioral patterns should be:
   - Reinforced (they're working well)
   - Adjusted (they need tuning based on experience)
   - Added (new traits emerging from experience)
5. If changes are warranted, update Soul.md with the modifications.
   - Append a changelog entry at the bottom: `<!-- Updated [date]: [brief description of change] -->`

Phase 3: Identity Refinement
6. Read your current Identity.md.
7. Based on your Memory.md analysis, determine if any responsibilities, decision authorities, or role definitions should be updated.
8. If changes are warranted, update Identity.md with the modifications.
   - Append a changelog entry at the bottom: `<!-- Updated [date]: [brief description of change] -->`

Phase 4: Log
9. Log to Memory.md:
   - "Self-improvement cycle completed at [time]."
   - Summary of changes made (or "No changes warranted.")

End of self-improvement cycle.
```

## Expected Output
- Each agent's Soul.md and Identity.md potentially updated with learnings
- Each agent's Memory.md updated with a self-improvement log entry
- Changelog comments in modified files for auditability

## Notes
- This is a human-authorized autonomous update process — agents have explicit permission to modify their own Soul.md and Identity.md during this cron
- Agents must NOT modify each other's files — only their own
- Changes should be incremental and conservative — no radical personality overhauls
- The human operator can review changelogs at any time by reading the `<!-- Updated -->` comments in Soul.md and Identity.md
- If an agent determines no changes are needed, it should log "No changes warranted" and complete the cycle
