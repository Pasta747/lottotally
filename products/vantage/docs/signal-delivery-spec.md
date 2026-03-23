# Vantage — Signal Delivery Spec (V-SIGNAL)
**Author:** CRO Marcus | **Date:** 2026-03-20
**For:** Einstein / Coder (implementation)

---

## Signal Format (WhatsApp / SMS)

Each signal message should contain exactly this:

```
🔭 Vantage Signal

Market: [Market name, max 40 chars]
Side: [YES / NO]
Current odds: [X¢]
Fair value: [X¢]
Edge: [+X.X%]
Suggested bet: $[X] (Kelly sized to your bankroll)

Reply YES to execute | PASS to skip | STOP to pause all signals
```

**Example:**
```
🔭 Vantage Signal

Market: Will Fed cut rates in May?
Side: NO
Current odds: 38¢
Fair value: 28¢
Edge: +26.3%
Suggested bet: $47 (Kelly sized to your bankroll)

Reply YES to execute | PASS to skip | STOP to pause all signals
```

---

## Signal Timing

- Signals sent only during market hours (6 AM – 10 PM PT)
- Max 3 signals per day per user (prevent decision fatigue)
- If user doesn't reply within 2 hours, auto-PASS the signal
- If user replies YES after 2 hours: "This opportunity has expired. Watching for next signal."

---

## Approval Flow (V-APPROVE)

| User Reply | Action |
|---|---|
| YES | Execute paper trade at current Kalshi price. Send confirmation. |
| PASS | Log as skipped. No trade. |
| STOP | Pause all signals. Send: "Signals paused. Reply START to resume." |
| START | Resume signals. |
| STATUS | Send current P&L summary immediately. |

**Confirmation message (after YES):**
```
✅ Trade placed (paper)

Market: [Market name]
Side: YES / NO  
Price: [X¢]
Amount: $[X]
Expected value: +[X]%

Track your positions: yourvantage.ai/dashboard
```

---

## Daily Summary (V-DAILY)

Sent every day at 8 AM PT:

```
🔭 Vantage Daily Briefing — [Day, Date]

Portfolio: $[balance] ([+/-X.X%] today)
Open positions: [N]
Settled today: [N wins] / [N losses]

Top signal today:
[Market name] — [side] — Edge: [X.X%]
Reply YES to queue it | PASS to skip

Full dashboard: yourvantage.ai/dashboard
```

---

## Email Format (for users who prefer email over WhatsApp)

Subject: `🔭 Vantage Signal — [Market name] [+X.X% edge]`

Body: Same content as WhatsApp signal, formatted with HTML.

---

## Database Schema (for V-SIGNAL implementation)

```sql
signals (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  market_id TEXT,          -- Kalshi market ticker
  side TEXT,               -- YES or NO
  kalshi_price_cents INT,  -- price at signal creation
  fair_value_cents INT,    -- our model's fair value
  edge_pct FLOAT,          -- (fair_value - price) / price
  kelly_amount_cents INT,  -- suggested bet size
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,    -- sent_at + 2 hours
  user_response TEXT,      -- YES / PASS / NULL (expired)
  responded_at TIMESTAMP,
  executed BOOLEAN DEFAULT false
)
```

---

*File: `/root/PastaOS/products/vantage/docs/signal-delivery-spec.md`*
