# Cron: Daily Executive Standup

## Schedule
Every day at 8:00 AM, local time

## Target Agent
COO_Pasta (orchestrator — initiates the standup and coordinates all participants)

## Participants
- COO_Pasta (facilitator)
- CTO_Einstein
- CMO_Gary
- CRO_Marcus

## Trigger Method
OpenClaw sends a `sessions send` message to the COO_Pasta session with the standup prompt.

## Prompt
```
COO Pasta — Daily Executive Standup

It is 8:00 AM. Initiate the daily executive sync.

Phase 1: Gather Updates
1. Send a message to each sub-agent (CTO_Einstein, CMO_Gary, CRO_Marcus) via `sessions send`:
   "Daily standup check-in. Read your last 3 Memory.md entries and report:
    - What you accomplished since the last standup
    - What you're working on today
    - Any blockers or decisions needed"
2. Wait for responses from all agents.

Phase 2: Debate Round
3. Share each agent's update with the other agents.
4. Prompt one round of cross-functional feedback:
   - CTO: "Any technical implications of what CMO and CRO reported?"
   - CMO: "Any marketing angles from what CTO and CRO reported?"
   - CRO: "Any revenue implications from what CTO and CMO reported?"
5. Collect responses.

Phase 3: Synthesis
6. Generate a standup summary containing:
   - Executive Summary (3-5 bullet points)
   - Per-agent status table (Agent | Status | Key Update | Blockers)
   - Cross-functional insights from the debate round
   - Action items with owners
   - Decisions needed from the human operator (if any)
7. Log the full standup summary to COO_Pasta/Memory.md.
8. Send the summary to the human operator (ping via configured notification channel).

End of daily standup.
```

## Expected Output
- Standup summary logged to COO_Pasta/Memory.md
- Human operator receives a concise standup report
- Action items assigned to relevant agents

## Notes
- The standup should complete autonomously without human input
- If an agent is unresponsive, COO Pasta logs the failure and proceeds with available data
- The debate round is optional if time-constrained — COO Pasta can skip it and note "debate round skipped" in the summary
- Family_Assistant is excluded from business standups to maintain personal/work separation
