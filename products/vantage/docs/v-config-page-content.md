# V-CONFIG — User Configuration Page Content
_Copy-paste ready for Einstein | 2026-03-20_

---

## Page Title
**Your Settings**

---

## Section 1: Trading Preferences

### Bankroll

**Label:** Paper bankroll
**Helper:** How much virtual money should Vantage trade with? This is fake money during beta — no real funds at risk.

- Input: dollar amount
- Default: $1,000
- Min: $100 | Max: $10,000
- Hint below input: "We recommend $1,000. Positions will be sized proportionally using Kelly criterion."

---

### Risk Level

**Label:** Risk level
**Helper:** Controls how aggressively Vantage sizes each trade relative to your bankroll.

**Options (radio):**

**Conservative** — ¼ Kelly
> Smaller bets. Less variance. Best for watching how the agent performs before committing more.
> *Typical bet size: 0.5–1.5% of bankroll per trade*

**Moderate** *(recommended)* — ½ Kelly
> Balanced sizing. Mathematically efficient without excessive swings.
> *Typical bet size: 1–3% of bankroll per trade*

**Aggressive** — Full Kelly
> Maximum expected growth rate. Higher variance — your bankroll will swing more.
> *Typical bet size: 2–5% of bankroll per trade*

---

### Minimum EV Threshold

**Label:** Minimum edge required
**Helper:** Vantage only trades when the expected value exceeds this threshold. Higher = fewer but higher-quality signals.

- Slider: 3% to 15%
- Default: 5%
- Labels: "More signals" (3%) ←→ "Higher quality" (15%)
- Hint: "We recommend 5–8% to balance signal frequency with edge quality after fees."

---

### Daily Exposure Limit

**Label:** Max daily exposure
**Helper:** Vantage won't place new trades once this total is reached for the day, regardless of opportunities.

- Input: dollar amount
- Default: $200
- Min: $20 | Max: $2,000
- Hint: "Set this to 10–20% of your bankroll. Default $200 assumes $1,000 bankroll."

---

## Section 2: Notifications

### Signal Delivery

**Label:** How should I reach you?

- ☑ WhatsApp *(your connected number)*
- ☐ Email *(enter email below)*
- ☐ Both

**WhatsApp number:** [displayed, not editable here — change in Account settings]
**Email:** [text input, optional]

---

### Approval Mode

**Label:** Trade approval

**Require approval for each trade** *(recommended for beta)*
> I'll send you a signal and wait for your YES or PASS before executing. You stay in control.

**Auto-execute within my limits**
> I'll execute automatically when edge exceeds your minimum EV threshold and position is within your daily limit. You'll still get notifications after the fact.

*Hint: Start with approval mode. Switch to auto-execute once you've seen a few signals and are comfortable with how I trade.*

---

### Daily Summary

**Label:** Daily P&L summary
**Helper:** Receive a summary of the day's trades, wins/losses, and running bankroll each evening.

- ☑ Send daily summary (enabled by default)
- Time: 6:00 PM PT *(not configurable in beta)*

---

## Section 3: Scanner Preferences

### Market Categories

**Label:** Which Kalshi market types should I scan?

- ☑ Sports (NBA, NFL, MLB)
- ☑ Economics (CPI, Fed rates, jobs)
- ☑ Crypto (BTC, ETH price markets)
- ☑ Weather
- ☑ Politics
- ☐ Entertainment *(coming soon)*

*Hint: Leave all enabled for beta. We'll learn which categories perform best for you over time.*

---

### Scan Frequency

*Not user-configurable in beta — scanner runs every 5 minutes automatically.*

---

## Save Button

**[Save Settings]**

→ On save: "✅ Settings saved. Changes take effect on the next scan."

---

## Reset to Defaults

**[Reset to defaults]** (secondary/text link, below save button)
→ Confirmation: "Reset all settings to recommended defaults?"

---

## Danger Zone (bottom of page, collapsed by default)

**Disconnect Kalshi**
> Remove your Kalshi API key and stop all scanning. Your trade history is preserved.
> [Disconnect Kalshi] (red button)

**Delete Account**
> Permanently delete your account and all data. This cannot be undone.
> [Delete Account] (red button)
