# Instantly API Campaign Automation (Pinger)

Built for Mario-approved zero-UI setup from:
- Spec: `/root/PastaOS/CMO_Gary/pinger/INSTANTLY_CAMPAIGN_CONFIG_V2.md`
- Docs: `https://developer.instantly.ai`

## What this automation covers

- Campaign creation (`POST /api/v2/campaigns`)
- Step/sequence configuration (`sequences[].steps[].variants[]`)
- Sending window (`campaign_schedule.schedules[]` with timezone/day/time)
- Lead upload (`POST /api/v2/leads/add`, up to 1000 per call)
- A/B test setup (multiple `variants` on step 1 + `auto_variant_select.trigger=open_rate`)
- Tracking settings (`open_tracking`, `link_tracking`, `insert_unsubscribe_header`) + UTM links embedded in bodies
- Stop-on-reply (`stop_on_reply`, `stop_on_auto_reply`)

## Files

- `instantly_campaign_setup.mjs` — end-to-end setup script
- `instantly_payload_preview.json` — generated when run in preview mode

## API endpoint map used

- `POST /api/v2/campaigns` — create Campaign 1 + Campaign 2
- `POST /api/v2/subsequences` — openers re-engagement for Campaign 1 (Step 4/5 logic)
- `POST /api/v2/leads/add` — upload leads directly to campaign
- `PATCH /api/v2/campaigns/{id}` — used by `--ramp` mode to move to 40/day

## Required API key scopes

At minimum:
- `campaigns:create`
- `campaigns:update`
- `subsequences:create`
- `leads:create`

Or broader: `campaigns:all`, `subsequences:all`, `leads:all`.

## Usage

### 1) Preview payloads only (safe)

```bash
node /root/PastaOS/COO_Pasta/instantly_api/instantly_campaign_setup.mjs
```

### 2) Create campaigns/subsequence + upload leads

```bash
export INSTANTLY_API_KEY="<paste key>"
export PROSPECT_CSV_PATH="/root/PastaOS/CMO_Gary/pinger/prospect-list-v3.csv"
node /root/PastaOS/COO_Pasta/instantly_api/instantly_campaign_setup.mjs --apply
```

### 3) Ramp to 40/day on Mar 28

```bash
export INSTANTLY_API_KEY="<paste key>"
export INSTANTLY_CAMPAIGN_IDS="<campaign1_id>,<campaign2_id>"
node /root/PastaOS/COO_Pasta/instantly_api/instantly_campaign_setup.mjs --ramp
```

## Important notes

1. **Openers-only Step 4/5 nuance:** API does not expose a simple per-step “send only if opened” flag on main campaign steps. Script models this via subsequence triggers. Validate behavior in a test workspace before production send.
2. **MCP support:** Current public docs index (`llms.txt`) and OpenAPI spec expose REST endpoints; MCP-specific connection docs were not present in indexed pages at execution time.
3. **Rate limits:** Workspace-level limits documented as 100 req/s and 6,000 req/min.
