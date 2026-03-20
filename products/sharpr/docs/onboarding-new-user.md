# Sharpr Beta Onboarding — New User (No Kalshi Account)
**For: Beta tester starting from scratch**

---

## What You'll Get
Sharpr is an AI sports betting agent that scans markets 24/7, finds +EV (positive expected value) opportunities, and sizes them to your bankroll using Kelly criterion. During beta, everything runs in **paper trading mode** (no real money).

You'll receive signals via WhatsApp and can approve or pass on each one.

---

## Setup Steps (15 minutes)

### Step 1: Create a Kalshi Account

1. Go to **https://kalshi.com/sign-up**
2. Sign up with your email
3. **Verify your identity** — Kalshi requires ID verification (US residents only)
   - Upload a government-issued ID (driver's license or passport)
   - Verification usually takes 5-30 minutes
4. **You do NOT need to deposit money** — we're paper trading only

**What is Kalshi?** It's a regulated prediction market (approved by the CFTC). You can trade on outcomes of real-world events — sports, elections, economics, weather. Think of it like a stock exchange but for predictions.

### Step 2: Get Your API Key

Once your account is verified:

1. Log in to **https://kalshi.com**
2. Go to **Settings → API** (or visit https://kalshi.com/account/api directly)
3. Click **"Create API Key"**
4. Name it: "Sharpr Beta"
5. **Set permissions to: Read + Trade**
6. You'll see two values:
   - **API Key ID** — copy this (looks like: `abc123def456`)
   - **API Secret** — shown ONCE, copy it immediately!
7. **Save both in a safe place** (password manager, secure note, etc.)

⚠️ **The API Secret is only shown once.** If you lose it, you'll need to create a new key.

### Step 3: Access Paper Trading Mode

Kalshi has a demo environment for risk-free testing:

1. Go to **https://demo.kalshi.com**
2. Log in with your same Kalshi credentials
3. Your demo account has fake funds for paper trading
4. Your API key works on both live and demo — Sharpr will use the demo endpoint

### Step 4: Send Us Your Info

Reply to your Sharpr WhatsApp thread (or send to Mario) with:

1. ✅ **Kalshi API Key ID**
2. ✅ **Kalshi API Secret**
3. ✅ **Your WhatsApp number** (for signal delivery)
4. ✅ **Paper bankroll amount** — how much fake money to start with? (default: $1,000)
5. ✅ **Risk level preference:**
   - **Conservative:** Smaller bets, less variance, steady growth
   - **Moderate:** Mathematically optimal sizing (recommended for most)
   - **Aggressive:** Bigger bets, more variance, faster if the edge holds

### Step 5: You're In

Once we configure your agent:
- Welcome message arrives on WhatsApp
- Signals come as the scanner finds +EV opportunities
- Each signal shows: what event, which side, expected edge %, your suggested bet size
- Reply **YES** to paper-execute, or **PASS** to skip
- Evening daily summary: your P&L, open positions, performance

---

## FAQ

**Is this legal?**
Yes. Kalshi is regulated by the CFTC (Commodity Futures Trading Commission). It's a legal, regulated prediction market for US residents.

**Do I need to deposit real money?**
No. Beta is paper trading only. Your demo account has fake funds.

**How does Sharpr make money for me?**
Sharpr finds bets where the odds are mispriced — where the true probability of winning is higher than what the market implies. Over many bets, this mathematical edge compounds. Think of it like card counting, but for prediction markets, and an AI does it for you.

**What's Kelly sizing?**
The Kelly criterion is a formula that tells you the optimal bet size based on your edge and bankroll. It maximizes long-term growth while managing risk. Sharpr calculates this for every signal.

**Can I lose money?**
In paper mode, no — it's fake money. When/if you go live, yes — individual bets can lose. But with a real +EV edge, the math favors you over many bets. Conservative mode reduces variance significantly.

---

## Questions?
Reply in your WhatsApp thread or text Mario directly.
