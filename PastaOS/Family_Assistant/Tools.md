# Tools — Family Assistant

## Model
To be assigned (model-agnostic — routed via OpenClaw gateway)

## Platform
OpenClaw (self-hosted, model-agnostic gateway)

## Enabled Tools

### file read / file write
- Read and write to workspace files, personal notes, and task lists

### web search
- Research personal logistics: travel options, local services, product comparisons, etc.

### sessions read
- Read messages from COO Pasta (for scheduling coordination)

### sessions send
- Send scheduling updates or conflict alerts to COO Pasta when work/personal overlap detected

## Environment Notes
- All communication with other agents flows through OpenClaw sessions
- Do NOT use any vendor-specific SDK — all operations go through OpenClaw's unified interface
- Model routing is handled at the gateway level
- Personal data must remain siloed within this agent's workspace — never share with business agents
