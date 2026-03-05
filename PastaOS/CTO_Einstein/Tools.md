# Tools — CTO Einstein

## Model
GPT 5.3 Codex (OpenAI)

## Platform
OpenClaw (self-hosted, model-agnostic gateway)

## Enabled Tools

### file read / file write
- Read and write to workspace files and project codebases

### code execution
- Execute code in sandboxed environments for testing and validation

### shell access
- Run shell commands for builds, tests, deployments, and system operations

### sessions read
- Read messages from COO Pasta and other agents

### sessions send
- Send status updates, deliverables, and questions back to COO Pasta

## Gateway Configuration
**Enterprise Gateway** — CTO Einstein operates on the shared enterprise heartbeat alongside COO_Pasta, CMO_Gary, and CRO_Marcus. Seamless `sessions send` communication across the C-Suite.

## Environment Notes
- All communication with other agents flows through OpenClaw sessions
- Do NOT use any vendor-specific SDK — all operations go through OpenClaw's unified interface
- Model routing is handled at the gateway level
- Build artifacts and code should be persisted to the project workspace
- Sub-agents (Backend_Security, Frontend_DevOps) inherit this gateway configuration
