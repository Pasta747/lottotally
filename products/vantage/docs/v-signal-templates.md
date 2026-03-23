# V-SIGNAL — Message Templates
_For notifier.js / WhatsApp signal delivery_
_Copy-paste ready for Einstein to wire into sendSignalMessage()_

---

## Signal Notification (per opportunity)

### Format A — Approve/Pass (default beta mode)

```
🔭 Vantage Signal

📊 {market_title}
Side: {side} ({side_emoji})
Price: {market_price}¢ → Fair value: {est_prob}%
Edge: +{ev_pct}% EV
Suggested size: ${suggested_size}

Reply YES to execute | PASS to skip
```

**Example:**
```
🔭 Vantage Signal

📊 Lakers vs Warriors — Lakers to win
Side: YES 🟢
Price: 42¢ → Fair value: 51%
Edge: +8.7% EV
Suggested size: $18

Reply YES to execute | PASS to skip
```

---

### Format B — Auto-executed (when autoExecute=true)

```
⚡ Vantage Auto-Trade

📊 {market_title}
Executed: {side} @ {fill_price}¢
Size: ${actual_size} | EV: +{ev_pct}%

Paper trade #{trade_count} today
```

---

### Format C — No signals (quiet day)

```
🔭 Vantage

Scanned {markets_scanned} Kalshi markets today.
No qualifying opportunities found (minimum +{min_ev}% EV required).

Scanner runs again in {next_scan_mins} minutes.
```

---

## Daily Summary (V-DAILY)

```
🔭 Vantage Daily Summary — {date}

Today's paper trades: {trade_count}
✅ Wins: {wins} | ❌ Losses: {losses}
P&L today: {daily_pnl_sign}${daily_pnl_abs}

Running total:
Bankroll: ${current_bankroll} (started: ${starting_bankroll})
Total P&L: {total_pnl_sign}${total_pnl_abs} ({total_pnl_pct}%)
Win rate: {win_rate}% ({total_wins}W / {total_losses}L)

{win_streak_msg}
---
yourvantage.ai
```

**Example:**
```
🔭 Vantage Daily Summary — Fri Mar 21

Today's paper trades: 3
✅ Wins: 2 | ❌ Losses: 1
P&L today: +$14.20

Running total:
Bankroll: $1,047 (started: $1,000)
Total P&L: +$47.00 (+4.7%)
Win rate: 67% (8W / 4L)

🔥 2-trade win streak
---
yourvantage.ai
```

---

## Welcome Message (on provisioning)

```
👋 Welcome to Vantage Beta!

Your AI prediction market agent is live.

Connected: Kalshi demo account ✅
Bankroll: ${bankroll} (paper)
Risk level: {risk_level}
Scanner: Running every 5 minutes

Here's how it works:
• I scan every Kalshi market for +EV opportunities
• When I find one, I'll text you here
• Reply YES to paper-execute, PASS to skip
• Every evening I'll send your daily P&L summary

First signals will arrive within the hour.

Questions? Reply anytime.
— Vantage 🔭
```

---

## Onboarding Step Confirmations

**API key connected:**
```
✅ Kalshi connected!

Demo balance: ${demo_balance}
Your agent is configured and scanning.

Reply HELP for commands or wait for your first signal.
— Vantage 🔭
```

**Settings updated:**
```
⚙️ Settings updated

Bankroll: ${bankroll}
Risk level: {risk_level}
Auto-execute: {auto_execute_status}

Changes take effect on the next scan.
```

---

## User Commands (WhatsApp reply handling)

| User says | Bot response |
|-----------|-------------|
| `YES` / `yes` / `y` | Execute the pending signal → confirm with trade details |
| `PASS` / `pass` / `skip` | Skip signal → "Got it. I'll keep looking." |
| `STATUS` / `status` | Current bankroll, today's P&L, open positions |
| `PAUSE` | Pause signal delivery → "Paused. Reply RESUME to restart." |
| `RESUME` | Resume → "Back online. Scanning now." |
| `HELP` | List all commands |
| `STOP` | Unsubscribe from all messages (WhatsApp compliance) |

---

## Error Messages

**Order failed:**
```
⚠️ Trade attempt failed

{market_title} — {side}
Error: {error_message}

The opportunity may have closed before execution. I'll look for the next one.
```

**Scanner error:**
```
⚠️ Scanner issue

Vantage encountered an error scanning markets. I'll retry in 15 minutes.

If this persists, contact support at hello@yourvantage.ai
```

**Kalshi connection lost:**
```
🔴 Kalshi connection lost

Your API key may have been revoked or expired.

To reconnect: yourvantage.ai/settings/connections

No trades will execute until reconnected.
```

---

## Implementation Notes for Einstein

```javascript
// In notifier.js, add template rendering:
function formatSignalMessage(signal, user) {
  const sideEmoji = signal.side === 'yes' ? '🟢' : '🔴';
  const evPct = (signal.evPct * 100).toFixed(1);
  const mktPrice = Math.round(signal.marketPrice * 100);
  const fairPct = Math.round(signal.estimatedProb * 100);
  const size = computeKellySize(user.bankroll, signal.ev, user.riskLevel);

  return [
    '🔭 Vantage Signal',
    '',
    `📊 ${signal.title}`,
    `Side: ${signal.side.toUpperCase()} ${sideEmoji}`,
    `Price: ${mktPrice}¢ → Fair value: ${fairPct}%`,
    `Edge: +${evPct}% EV`,
    `Suggested size: $${size}`,
    '',
    'Reply YES to execute | PASS to skip',
  ].join('\n');
}
```

The `whatsapp-queue.jsonl` outbox is already wired. OpenClaw reads it and sends via WhatsApp. Just append the formatted message using `sendSignalMessage(user, formatSignalMessage(signal, user))`.
