# Vantage Beta — User FAQ
_For beta testers and the signup page_
_Prepared by Achille | 2026-03-20_

---

## About Vantage

**What is Vantage?**

Vantage is an AI agent that scans Kalshi prediction markets around the clock, finds contracts where the price doesn't match the true probability, and places trades automatically within the limits you set.

Think of it as a hedge fund analyst that never sleeps — one that specializes entirely in finding edges in prediction markets so you don't have to.

**What is a prediction market?**

A prediction market is a place where you can trade on the outcome of real-world events — like "Will the Fed raise rates this month?" or "Will the Lakers win tonight?" — using real money.

Each contract pays out $1 if the event happens, $0 if it doesn't. The price of the contract is the market's probability estimate of that outcome.

Kalshi is the largest regulated prediction market in the US, licensed by the CFTC (the same regulator that oversees commodity futures).

**Is Vantage legal?**

Yes. Kalshi is a federally regulated exchange (CFTC-licensed). Trading on Kalshi is legal in all 50 US states. Vantage is a tool that automates trading on Kalshi — similar to how a stock trading bot automates trades on the NYSE.

---

## About Kalshi

**Do I need a Kalshi account?**

Yes. Vantage connects to your existing Kalshi account using a read/trade API key. If you don't have one, creating a Kalshi account takes about 5 minutes at kalshi.com.

**What is Kalshi's demo account?**

Kalshi offers a demo environment where you can place real orders against real market prices, but using fake money. This is what Vantage uses in beta — your positions and P&L are real simulations of what would have happened with real money, with zero actual financial risk.

Think of it like flight simulator for trading.

**How do I create a Kalshi API key?**

1. Go to kalshi.com → log in → Settings → API
2. Click "Create API key"
3. Give it a name (e.g. "Vantage")
4. Copy the API Key ID and the generated private key
5. Paste both into Vantage during setup

See `/docs/onboarding-existing-kalshi.md` for screenshots.

**Can Vantage access my money?**

During beta, Vantage only connects to your Kalshi **demo account**, which has no real money. Even in live mode (post-beta), Vantage only uses the amount you set as your bankroll — it cannot access funds beyond your configured limit.

---

## How Vantage Works

**How does Vantage find opportunities?**

Vantage runs three scanning layers continuously:

1. **Sports Layer** — compares Kalshi sports contract prices against consensus odds from 250+ sportsbooks. When Kalshi's implied probability differs from the consensus by more than 3%, it's a potential edge.

2. **Kalshi Native Layer** — scans all active Kalshi markets across economics, weather, politics, and crypto. Uses data signals (FRED economic data, NOAA forecasts, etc.) to estimate fair value and find mispriced contracts.

3. **News Layer** — monitors real-time data feeds for events that should move specific Kalshi markets before prices update.

Signals from all three layers are weighted by an ATLAS system that learns which categories and sources have been most accurate — giving more weight to historically reliable signals over time.

**What is EV+ (Expected Value)?**

Expected Value (EV) is the statistical edge on a bet. If a contract has a true probability of 60% but is priced at 50¢ (implying 50%), buying it at 50¢ has a positive expected value because you're getting better odds than the true probability justifies.

Vantage only trades when expected value is meaningfully positive — typically 5-8% or more after accounting for fees.

**What does "paper trading" mean?**

Paper trading means placing simulated orders at real market prices with fake money. Your positions and P&L reflect exactly what would have happened with real money, but nothing is actually risked.

During the beta period, Vantage operates exclusively in paper trading mode. No real money is ever moved.

**How does Vantage decide how much to trade?**

Vantage uses a Kelly Criterion-based sizing algorithm. Kelly tells you the mathematically optimal fraction of your bankroll to risk on each trade based on your edge and the odds. We use a conservative ¼ Kelly by default.

Example: If your bankroll is $1,000 and Kelly says 2% on a particular trade, Vantage would place $5 (¼ × 2% × $1,000).

You can set a maximum per-trade limit and a daily exposure limit in settings.

---

## Beta Program

**What does the beta include?**

- Full paper trading on your Kalshi demo account
- Daily P&L summary delivered via email or WhatsApp
- Signal notifications for every opportunity found
- Approve/pass controls — you can review each signal before it executes
- 30 days free, no credit card required

**Do I have to approve every trade?**

By default, yes — you'll receive a notification for each signal and can approve or pass. You can also set Vantage to auto-execute trades that meet your criteria (minimum EV, position size limits, etc.) without requiring approval.

**What results should I expect in paper trading?**

In our internal paper trading period, we saw a 66.7% win rate and +42% ROI over 15 trades. This is a small sample — prediction markets are inherently uncertain, and past paper trading results don't guarantee future performance.

Realistic expectations for a systematic EV+ approach over time: 55-65% win rate, 20-50% annual ROI (highly variable, dependent on market conditions and edge availability).

**Is there a risk of losing money in beta?**

No. Beta is paper trading only — no real money involved. The risk is zero. The purpose of beta is to validate that Vantage's signals and execution are working correctly before any real money is involved.

---

## Pricing (Post-Beta)

**How much will Vantage cost after beta?**

Post-beta pricing is still being finalized. Expected range: $79-149/month. Beta users will receive a discounted rate.

**What happens to my beta data when paid tiers launch?**

Your paper trading history, P&L record, and settings carry over seamlessly. Nothing is lost.

---

## Technical / Privacy

**Is my Kalshi API key secure?**

Your API key is encrypted at rest using AES-256 encryption. It is never logged, displayed, or transmitted in plaintext after initial setup. You can revoke the key from Kalshi at any time — this immediately disconnects Vantage.

**Does Vantage store my trading data?**

Vantage stores your signal history, paper trade records, and P&L summaries. This data is used to power your dashboard and improve signal accuracy. It is never sold or shared.

**Can I delete my account and data?**

Yes. Email hello@yourvantage.ai and we will delete all your data within 48 hours.

---

## Disclaimers

**Is Vantage financial advice?**

No. Vantage is an automated trading tool. It is not a registered investment advisor, broker, or financial counselor. All trading decisions are ultimately made by you. Past performance does not guarantee future results.

**Is prediction market trading risky?**

Yes. Even with a statistical edge, individual trades can lose. Never trade more than you can afford to lose. This is especially important for live trading (post-beta).

**Are there age/location restrictions?**

You must be 18+ to use Kalshi and Vantage. Kalshi is available in all 50 US states. International availability varies by country — check Kalshi's terms for your jurisdiction.
