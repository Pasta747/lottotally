# Vantage — Competitor Analysis
_Research by Achille | 2026-03-20_

---

## Summary: No Direct Competitors for AI Prediction Market Agents

There is **no existing product** that autonomously scans Kalshi, calculates EV, and executes paper/live trades on behalf of users. Vantage is genuinely novel in this specific combination.

Competitors fall into three adjacent categories: sportsbook EV tools (don't touch Kalshi), prediction market platforms (data only, no automation), and general AI trading bots (crypto/equity focus, not prediction markets).

---

## Category 1: Prediction Market Platforms (Data, No Automation)

### Polymarket
- **What it is:** Largest prediction market by volume (~$500M+ monthly volume). Crypto-based (USDC), DeFi
- **Price:** Free to use; takes ~2% per trade in fees
- **Automation:** No official automation API for retail users. Some power users use custom scripts
- **Kalshi overlap:** Polymarket and Kalshi price the same events — useful as a **consensus signal** for our fair value model
- **Why not a competitor:** They're a platform, not a tool. No agent layer, no scanning, no EV analysis

### Manifold Markets
- **What it is:** Play-money social prediction market. Free. No real money.
- **Users:** ~500K registered, highly engaged forecasting community
- **Automation:** Open API, some community bots exist
- **Why not a competitor:** Play money only. Their calibration data is useful research, but they don't serve the real-money use case

### Metaculus
- **What it is:** Forecasting platform, community-driven, question-and-answer format
- **Price:** Free
- **Why not a competitor:** No trading, no real money, no automation. Pure forecasting community.

---

## Category 2: Sportsbook EV Tools (Adjacent, Different Exchange)

### OddsJam
- **What it is:** EV+ scanner for sportsbooks (FanDuel, DraftKings, etc.), odds comparison
- **Price:** ~$200-299/mo (pricing page JS-blocked; industry estimates)
- **Automation:** Shows opportunities, no auto-execution
- **Kalshi coverage:** None — focused on licensed sportsbooks only
- **Why not a competitor:** Different exchange entirely. BUT: our sports scanner (Layer 1) competes with OddsJam's core product. Vantage extends this to Kalshi where OddsJam can't go.

### Unabated
- **Price:** $249/mo (NBA), $55-99 standalone tools
- **What it is:** Professional EV/CLV tools, "Unabated Line" as fair value reference
- **Automation:** None — tools for human decision-making
- **Kalshi coverage:** None
- **Why not a competitor:** Same as OddsJam. Vantage's unique moat is Kalshi + automation.

### RebelBetting
- **Price:** €99-199/mo
- **What it is:** Value betting + sure betting, European sportsbooks focus
- **ROI claim:** "30% monthly ROI" guarantee
- **Automation:** Partial — shows bets, some semi-auto features
- **Kalshi coverage:** None
- **Why not a competitor:** EU-focused, no Kalshi

---

## Category 3: AI Trading Bots (General, Not Prediction Markets)

### Composer.trade
- **What it is:** No-code AI trading bot for equities/ETFs
- **Price:** ~$19-49/mo
- **Target:** Retail investors, algorithmic equity trading
- **Why not a competitor:** Stocks/ETFs only, no prediction markets

### Autopilot (Wealthfront, Betterment, etc.)
- Robo-advisors for long-term investing — completely different use case

### Custom Polymarket bots (GitHub open source)
- Several hobbyist projects on GitHub scan Polymarket and auto-trade
- No commercial product, no UI, requires technical setup
- **Closest thing to Vantage** that exists — but scattered, unmaintained, no multi-user support
- **Opportunity:** Vantage is the polished, multi-user, managed version of what these hobbyists built

---

## The Actual Competitive Landscape for Vantage

```
                          AI-Automated?
                     YES              NO
Kalshi-focused    [VANTAGE]        Kalshi itself
                                   
Sportsbook-focus  [none exist]     OddsJam
                                   Unabated
                                   RebelBetting

Prediction mkts   [hobbyist bots]  Polymarket
(broader)         [none commercial] Manifold
```

**Vantage owns the top-left quadrant.** No commercial product does AI-automated Kalshi scanning + execution.

---

## Positioning Implications

**Message to use:** "The only AI agent that scans every Kalshi market and executes automatically."

**Why this matters:** OddsJam users have to manually place bets on sportsbooks after seeing signals. Vantage does both the scanning AND the execution — that's the 10x improvement that justifies the price.

**Risk:** Kalshi themselves could build this. Mitigation: we're building the customer relationship and brand; a Kalshi-native tool would commoditize scanner, but our ATLAS weighting + multi-market intelligence would still differentiate.

---

## Addressable Market

- Kalshi registered users (2026 estimate): ~500,000
- Active traders: ~50,000-100,000
- Power users willing to pay for automation: ~5,000-15,000
- At $99/mo × 5,000 users = **$500K MRR** realistic 12-month target
- At $99/mo × 15,000 users = **$1.5M MRR** 24-month target
