# PastaOS Operating Model — v2
**OWNER:** Pasta (COO)
**DATE:** 2026-03-30
**STATUS:** Locked pending Mario approval

---

## Core Principle

Mario is only involved in strategic decisions. Everything else flows through the agent team. Execution runs at machine speed, not human speed.

---

## Shared Sprint Board

**Location:** `/root/PastaOS/daily-ops-sprint.md`

**Rules:**
- **Chronos owns it** — maintains, updates, flags stale items every 30 min
- **All agents read AND write it directly** — no more passing through Pasta to update it
- **Pasta reads it** but does NOT maintain it — I'm consumer and escalator, not scribe
- If an agent completes something → write it to the sprint board immediately, then to their INBOX
- If an agent is blocked → write BLOCKED + owner + reason to the sprint board immediately

**Sprint board schema:**
```
| Task | Owner | Status | Age | Escalation |
```
- Age = hours since last update
- Escalation = blank / ⚠️ / 🔴

---

## Product GM Assignments

| Product | GM Agent | Reports Operationally To | Reports Financially To |
|---|---|---|---|
| Vantage | **Hera** | Pasta (COO) | Nike (CFO) |
| LottoTally | **Artemis** | Pasta (COO) | Nike (CFO) |
| Canopy | **Iris** | Pasta (COO) | Nike (CFO) |
| Pinger | **Rhea** | Pasta (COO) | Nike (CFO) |

Product GMs own their product end-to-end. They write status to the sprint board daily. Nike owns their financial forecasts and tracks ARR.

---

## Operating Cadence

| Time | Who | What | Output |
|---|---|---|---|
| **Every 30 min** | Chronos | Scan sprint board, update ages, flag stale items | Sprint board refreshed |
| **Every 30 min** | Chronos | Check for blocked tickets → escalate to Pasta within 1 cycle | P0 → Pasta |
| **6:30 AM PT daily** | Athena | Morning briefing to Mario (Telegram) | What's done, blocked, needs Mario |
| **Daily (async)** | 4 Product GMs | 5-line status to sprint board | Daily status post |
| **Every 30 min** | All agents | Read sprint board before starting new work | No duplicate effort |
| **Friday (async)** | All agents | 5-line weekly sync to `weekly-sync.md` | Friday all-hands |
| **Monday (async)** | Pasta | Summarize Friday all-hands → Athena | Athena includes in Monday briefing |
| **Weekly** | Nike | Financial report (ARR, burn, product P&L) → Mario | Document |
| **Weekly** | Pasta | All-hands sync (all agents) | 60-min async review |

---

## P0 Escalation Rules

**Permanent rules — no exceptions:**

### Rule 1: Key metric at zero for 48+ hours = P0
Any key metric at zero for 48+ consecutive hours while a campaign/channel is live:
- Cold email: 0 replies after 48h of active sending
- Revenue: $0 after 48h of live payment link
- Pipeline: 0 qualified leads after 48h of active campaign
- Signups: 0 new users after 48h of live launch

**Escalation path:**
1. Agent marks P0 in sprint board immediately
2. Escalates to Pasta within one Chronos cycle
3. If unresolved after one more cycle → Mario within one cycle

### Rule 2: Blocker escalation
Any ticket blocked for >24h with no resolution path → Pasta within one cycle.

If Pasta can't resolve within 24h → Mario within one cycle.

### Rule 3: Mario's three explicit escalation triggers

Mario only hears about things that meet one of these three:

1. **Revenue event** — first dollar, first churn, first big deal, Stripe anomaly
2. **P0 that exceeded 48h and is still unresolved** — cold email at 0 replies for 48h with no fix, deploy blocked for 72h+, product down
3. **Strategic decision needed** — "do we accept this partnership?", "should we change our pricing?", "shoud we kill this product?"

**Everything else** — agents handle it. I handle it. Nike handles it. The GMs handle it.

---

## Shared Ticket Store — Einstein's Sprint Ticket

**Einstein owns this:** Design and build a shared ticket store to replace distributed markdown files as coordination layer.

**Requirements:**
- Single source of truth for all active tasks
- Each task has: owner, product, priority, status, age, blocker
- All agents can read AND write
- Chronos can update automatically
- Filtered views by product, by owner, by priority
- P0 tickets surface immediately
- Replaces: daily-ops-sprint.md, all INBOX/status.md files (INBOX becomes internal agent notes only)

**Timeline:** Design by end of this week, implementation by end of next week.

---

## Nike — First Week Deliverables (Unblock Before Operational)

Nike is not operational until these three exist:

1. **ARR baseline** — current state of all 4 products, $0 revenue documented, burn tracked
2. **Weekly report template** — fixed format, delivered every Monday morning
3. **Per-product forecast targets** — 12-month ARR projection per product, shared with each GM

Once these three exist → Nike is live and running.

---

## Friday Async All-Hands

**Format:** Every Friday, each agent writes 5 lines to `/root/PastaOS/weekly-sync.md`

**5-line template:**
```
[Agent Name]
1. What I shipped this week
2. What's blocked and by whom
3. What I'm prioritizing next week
4. One thing the team should know
5. One thing Mario should know
```

**Flow:** Friday → agents write → Pasta summarizes → Athena includes in Monday briefing to Mario.

---

## Achille — Special Projects

**Reports to:** Mario directly — outside core product scope

**Scope:** Special projects assigned by Mario. Operates independently, not part of the core product org. Outside the four core products.

**Coordination:** Achille's work is included in Athena's daily briefing to Mario. No standing meeting — project-based only.

---

## Plutus — Chief Investment Officer

**Reports to:** Pasta (COO), dotted-line to Nike for financial reporting

**Scope:** BTC RSI trading, equity trading engine, ATLAS framework, Vantage financial modeling support

**Coordination:**
- Plutus's trading/investment P&L feeds into Nike's weekly financial report
- Hera (Vantage GM) coordinates with Plutus on Vantage product financial modeling
- Nike tracks Plutus investment performance as part of PastaOS overall burn/revenue picture

**Important:** Plutus owns the trading engine. Hera owns the Vantage product. They work together — Plutus provides the financial modeling layer, Hera owns the product outcome.

---

## Financial Variance Rule

**Trigger:** Any product that is 20%+ below its monthly ARR forecast.

**When triggered:**
1. Nike flags it as a **Financial P0** in the sprint board
2. Nike escalates to Pasta within one sprint cycle
3. Pasta convenes a product review within one sprint cycle — attendees: Pasta, Nike, relevant Product GM, relevant functional lead (Gary/Marcus/Einstein)
4. Output: recovery plan or revised forecast with rationale

**Exemption:** New product launches in their first 30 days are exempt (insufficient baseline).

---

## What Mario Is NOT Involved In

- Day-to-day task prioritization
- Agent coordination (that's my job)
- Status updates on tasks he didn't create
- Tactical decisions on campaigns, content, or product features
- Performance reviews of agents

Mario's job: set direction, make strategic calls, approve major decisions. Everything else is the team's.

---

## Summary: Mario's View

| What | How |
|---|---|
| Daily status | Athena briefing (6:30 AM PT) |
| Weekly financial | Nike report (Monday) |
| Weekly all-hands summary | Athena Monday briefing (Friday recap) |
| P0 escalation | Telegram from me — only when 48h+ and still unresolved |
| Strategic decisions | I bring them to Mario with a recommendation |
| Everything else | Handled by the team |

---

**Approved by:** Mario (pending)
**Last updated:** 2026-03-30 by Pasta