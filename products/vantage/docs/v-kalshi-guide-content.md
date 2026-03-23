# V-KALSHI-GUIDE — In-App Content
_For the Kalshi setup page in the Vantage app_
_Copy-paste ready for Einstein to implement_

---

## Page: "Connect Your Kalshi Account"

### Header
**Connect Kalshi**

### Subtext
> Vantage needs your Kalshi API key to scan markets and place paper trades on your behalf. Setup takes about 3 minutes.

---

## Step 1 — Create a Kalshi Account (if needed)

> **Don't have a Kalshi account?**
>
> Kalshi is a federally regulated prediction market licensed by the CFTC.
> Creating an account is free and takes 5 minutes.
>
> [Create Kalshi Account →] (links to https://kalshi.com/sign-up)
>
> Already have an account? Skip to Step 2.

---

## Step 2 — Get Your API Key

> 1. Log in to **kalshi.com**
> 2. Go to **Settings** → **API** (or visit kalshi.com/account/api)
> 3. Click **"Create API Key"**
> 4. Name it **"Vantage"**
> 5. Set permissions: **Read + Trade**
> 6. Copy both values below — the secret is shown **once only**

**Input fields:**
- Label: `API Key ID` | Placeholder: `abc123def456...` | Helper: "Found in Kalshi → Settings → API"
- Label: `API Secret` | Placeholder: `-----BEGIN RSA PRIVATE KEY-----...` | Helper: "Shown once when you create the key — paste the full text including the header lines"

**[Paste key button]** — auto-detects and fills both fields if user pastes the full Kalshi key export JSON

---

## Step 3 — Enable Demo Mode

> **For beta, Vantage only trades on your Kalshi demo account** — no real money involved.
>
> Your API key works on both live and demo. We'll only use the demo endpoint during beta.
>
> **What is demo mode?** You get a virtual $10,000 balance to trade with. Positions and P&L reflect exactly what would happen with real money — zero actual risk.
>
> ✅ Demo mode is enabled automatically. No action needed.

---

## Step 4 — Set Your Paper Bankroll

> How much virtual money should Vantage trade with?

**Input:** Bankroll amount
- Default: $1,000
- Min: $100
- Max: $10,000
- Helper text: "This is fake money for beta. We recommend $1,000 to keep position sizes realistic."

---

## Step 5 — Choose Your Risk Level

> **Conservative** — ¼ Kelly sizing. Smaller bets, lower variance. Best if you're just watching how it works.
>
> **Moderate** (recommended) — ½ Kelly. Balanced sizing based on mathematical edge.
>
> **Aggressive** — Full Kelly. Maximizes expected growth but with higher variance. Only if you're comfortable with swings.

**Radio buttons:** Conservative | Moderate (default) | Aggressive

---

## Connect Button

**[Connect Kalshi Account]**

→ On click: validates key against Kalshi demo API (`GET /portfolio/balance`)
→ Success: "✅ Connected! Your demo balance is $[amount]."
→ Failure: "❌ Could not connect. Double-check your API Key ID and Secret, and make sure permissions include Trade."

---

## Security Note (below form)

> 🔒 **Your API key is encrypted at rest.** We use AES-256 encryption and never store your key in plaintext. You can revoke access from Kalshi at any time — this immediately disconnects Vantage.

---

## Help Section

**"Where do I find my API key?"**
> Settings → API in your Kalshi account. If you don't see the API section, make sure you're logged in at kalshi.com (not the app).

**"I lost my API secret — what do I do?"**
> Kalshi only shows the secret once. If you lost it, delete the old key in Kalshi and create a new one. Takes 2 minutes.

**"Can Vantage withdraw my money?"**
> No. The Trade permission only allows placing and canceling orders — not withdrawals. Your funds can only be withdrawn by you, directly from Kalshi.

**"What if I want to disconnect?"**
> Go to Settings → Connections in Vantage and click "Disconnect Kalshi." Or revoke the API key directly from your Kalshi account.
