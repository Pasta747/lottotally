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

Phase 1: Gather Overnight Reports
1. Send a message to each sub-agent (CTO_Einstein, CMO_Gary, CRO_Marcus) via `sessions send`:
   "Daily standup check-in. Read your last 3 Memory.md entries and report:
    - What you accomplished overnight / since the last standup
    - What you're working on today
    - Any blockers or decisions needed
    - Status of any sub-agent divisions under your command"
2. Wait for responses from all agents.

Phase 2: Debate Round
3. Share each agent's update with the other agents.
4. Prompt one round of cross-functional feedback:
   - CTO: "Any technical implications of what CMO and CRO reported?"
   - CMO: "Any marketing angles from what CTO and CRO reported?"
   - CRO: "Any revenue implications from what CTO and CMO reported?"
5. Collect responses.

Phase 3: Synthesis & Dashboard Update
6. Generate a standup summary containing:
   - Executive Summary (3-5 bullet points)
   - Per-agent status table (Agent | Status | Key Update | Blockers)
   - Cross-functional insights from the debate round
   - Action items with owners, priorities, and due dates
   - Decisions needed from the human operator (if any)
7. Log the full standup summary to COO_Pasta/Memory.md.
8. Compile all action items into a checklist and write them to:
   `PastaOS_Dashboard/Ops/action-items.md`
   Format: | # | Action Item | Owner | Priority | Due | Status |
9. Update `PastaOS_Dashboard/Ops/mission-control.md` with current session states.

Phase 4: Notification & Audio Briefing
10. Send the standup summary text to the human operator via Telegram:
    - Use the `telegram notify` tool
    - Include: Executive Summary, Action Items checklist, and any blocked decisions
11. Generate an audio briefing of the standup summary:
    - Use the `text-to-speech` tool to convert the full standup summary into an audio file
    - The audio should be listenable as a "morning podcast" briefing
    - Deliver the audio file to the human operator via Telegram or configured channel

End of daily standup.
```

## Expected Output
- Standup summary logged to COO_Pasta/Memory.md
- Action items checklist written to PastaOS_Dashboard/Ops/action-items.md
- Mission control dashboard updated in PastaOS_Dashboard/Ops/mission-control.md
- Human operator receives Telegram text summary
- Human operator receives TTS audio briefing ("morning podcast")

## Notes
- The standup should complete autonomously without human input
- If an agent is unresponsive, COO Pasta logs the failure and proceeds with available data
- The debate round is optional if time-constrained — COO Pasta can skip it and note "debate round skipped" in the summary
- PA_Athena is excluded from business standups to maintain personal/work separation (isolated gateway)
- The TTS audio briefing should be concise (2-5 minutes) and conversational in tone
