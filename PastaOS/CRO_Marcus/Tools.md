# Tools — CRO Marcus

## Model
Gemini 3 Flash (Google)

## Platform
OpenClaw (self-hosted, model-agnostic gateway)

## Enabled Tools

### file read / file write
- Read and write to workspace files, sales scripts, pipeline docs, and outreach templates

### web search
- Research prospects, competitors, market data, and pricing benchmarks

### sessions read
- Read messages and briefs from COO Pasta and other agents

### sessions send
- Send deliverables, pipeline updates, and questions back to COO Pasta

## Gateway Configuration
**Enterprise Gateway** — CRO Marcus operates on the shared enterprise heartbeat alongside COO_Pasta, CTO_Einstein, and CMO_Gary. Seamless `sessions send` communication across the C-Suite.

## Environment Notes
- All communication with other agents flows through OpenClaw sessions
- Do NOT use any vendor-specific SDK — all operations go through OpenClaw's unified interface
- Model routing is handled at the gateway level
- Sales assets and pipeline data should be persisted to workspace files
- Sub-agents (Product_Scout, Community_Growth) inherit this gateway configuration
