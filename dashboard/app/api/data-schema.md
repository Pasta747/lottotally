# Mission Control — Data API Schema

## State Files (written by agents, read by API)

### `/data/agents.json`
```json
{
  "last_updated": "2026-03-31T16:30:00Z",
  "agents": [
    {
      "id": "einstein",
      "name": "Einstein",
      "role": "CTO",
      "status": "operational",
      "last_updated": "2026-03-31T16:30:00Z",
      "current_task": "M1: Data API layer",
      "blocker": null
    }
  ]
}
```

### `/data/sprint.json`
```json
{
  "last_updated": "2026-03-31T16:30:00Z",
  "items": [
    {
      "id": "M1",
      "task": "Data API layer",
      "owner": "Einstein",
      "status": "in_progress",
      "age_hours": 0,
      "escalation": ""
    }
  ]
}
```

### `/data/metrics.json`
```json
{
  "last_updated": "2026-03-31T16:30:00Z",
  "products": {
    "pinger": { "arr": 0, "forecast": 0, "status": "red" },
    "canopy": { "arr": 0, "forecast": 0, "status": "red" },
    "lottotally": { "arr": 0, "forecast": 0, "status": "red" },
    "vantage": { "arr": 0, "forecast": 0, "status": "red" }
  },
  "total_arr": 0,
  "burn": 1400,
  "pipeline": 0
}
```

### `/data/blockers.json`
```json
{
  "last_updated": "2026-03-31T16:30:00Z",
  "p0s": [],
  "blockers": []
}
```

## API Endpoints (GET only)

| Method | Path | Description |
|--------|------|-------------|
| GET | /api/data/agents | Agent statuses + last_updated |
| GET | /api/data/sprint | Sprint board state + item ages |
| GET | /api/data/metrics | Product ARR, forecast, pipeline |
| GET | /api/data/blockers | Active P0s and blockers |
| GET | /api/data/health | Overall system health + staleness |

## Staleness Rules

- 🟢 GREEN: `<2h` since last_updated on all sections
- 🟡 YELLOW: any section `2-6h` since last_updated
- 🔴 RED: any section `6h+` since last_updated OR any P0 exists

## Agent Write Protocol

Agents POST updated JSON to:
- POST /api/data/agents — update agent state
- POST /api/data/sprint — update sprint item
- POST /api/data/metrics — update metrics
- POST /api/data/blockers — update blockers

All POSTs update `last_updated` timestamp automatically.
