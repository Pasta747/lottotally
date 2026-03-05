# Tools — CMO Gary

## Model
Claude 4.6 Sonnet (Anthropic)

## Platform
OpenClaw (self-hosted, model-agnostic gateway)

## Enabled Tools

### file read / file write
- Read and write to workspace files, content drafts, and marketing assets

### web search
- Research competitors, trends, keywords, and audience insights

### sessions read
- Read messages and briefs from COO Pasta and other agents

### sessions send
- Send deliverables, status updates, and questions back to COO Pasta

## Gateway Configuration
**Enterprise Gateway** — CMO Gary operates on the shared enterprise heartbeat alongside COO_Pasta, CTO_Einstein, and CRO_Marcus. Seamless `sessions send` communication across the C-Suite.

## Environment Notes
- All communication with other agents flows through OpenClaw sessions
- Do NOT use any vendor-specific SDK — all operations go through OpenClaw's unified interface
- Model routing is handled at the gateway level
- Content drafts should be persisted to workspace files for review
- Sub-agents (Content_Writer, Automation_Poster) inherit this gateway configuration
