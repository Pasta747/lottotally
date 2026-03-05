# Tools — PA Athena

## Model
Claude 4.6 Sonnet (Anthropic)

## Platform
OpenClaw (self-hosted, model-agnostic gateway)

## Gateway Configuration
**ISOLATED GATEWAY** — PA Athena operates on her OWN dedicated heartbeat and gateway instance, completely walled off from the enterprise business gateway.

### Isolation Rules
- PA Athena's gateway does NOT share a heartbeat with COO_Pasta, CTO_Einstein, CMO_Gary, or CRO_Marcus
- Personal memory logs, calendar data, and family information never transit the enterprise gateway
- The only bridge between gateways is a narrow scheduling-conflict channel to COO Pasta (see sessions send below)

## Enabled Tools

### file read / file write
- Read and write to workspace files, personal notes, and task lists

### web search
- Research personal logistics: travel options, local services, product comparisons, etc.

### sessions read
- Read messages from COO Pasta (scheduling coordination only — via cross-gateway bridge)

### sessions send
- Send scheduling conflict alerts to COO Pasta (via cross-gateway bridge)
- Scope: ONLY work/personal scheduling overlaps — no personal data transmitted

## Environment Notes
- All communication with other agents flows through OpenClaw sessions
- Do NOT use any vendor-specific SDK — all operations go through OpenClaw's unified interface
- Model routing is handled at the gateway level
- **CRITICAL: Personal data must remain siloed on PA Athena's isolated gateway — never share with business agents**
