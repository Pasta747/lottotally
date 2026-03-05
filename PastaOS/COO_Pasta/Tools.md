# Tools — COO Pasta

## Model
Claude 4.6 Opus (Anthropic)

## Platform
OpenClaw (self-hosted, model-agnostic gateway)

## Enabled Tools

### sessions send (CRITICAL)
- **This is the primary orchestration tool.** It allows COO Pasta to send messages and delegate tasks to any other agent session running in OpenClaw.
- Usage: `sessions send <agent_session_id> <message>`
- Use this to:
  - Assign tasks to CTO_Einstein, CMO_Gary, CRO_Marcus, or PA_Athena
  - Request status updates from sub-agents
  - Relay human operator directives to the appropriate agent
  - Trigger cross-agent workflows (e.g., "CTO build feature → CMO write launch copy → CRO prepare outreach")

### sessions list
- List all active agent sessions in the OpenClaw environment

### sessions read
- Read the latest transcript or output from a sub-agent session

### file read / file write
- Read and write to workspace files (Soul.md, Identity.md, Memory.md, etc.)

### cron triggers
- Ability to be invoked by scheduled cron jobs (daily standup, nightly reviews)

### dashboard write
- Write updates to PastaOS_Dashboard/ files (mission-control.md, action-items.md, briefs.md, backlog.md, approved-tasks.md, experiments.md)

### telegram notify
- Send summary messages to the human operator's Telegram

### text-to-speech
- Generate audio briefings from standup summaries for the human operator's morning podcast

## Gateway Configuration
**Enterprise Gateway** — COO Pasta operates on the shared enterprise heartbeat alongside CTO_Einstein, CMO_Gary, and CRO_Marcus. PA_Athena runs on a separate isolated gateway.

## Environment Notes
- All inter-agent communication flows through OpenClaw's session management
- Do NOT use any vendor-specific SDK (no Claude Agent SDK, no OpenAI Assistants API)
- All agents are accessed via OpenClaw's unified interface
- Model routing is handled at the gateway level — agents are model-agnostic by design
- PA_Athena communicates via a cross-gateway bridge (scheduling conflicts only)
