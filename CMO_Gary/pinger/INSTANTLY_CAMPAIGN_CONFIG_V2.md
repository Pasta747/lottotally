# Pinger 🏓 — Instantly.ai Campaign Configuration
**Status:** READY FOR MARIO — plug this into Instantly.ai before Mar 21  
**Sending from:** mario@trypinger.com  
**Updated:** 2026-03-15  
**Target launch date:** Mar 21, 2026 (warmup completes)

---

## PRE-LAUNCH CHECKLIST (verify before first send)

- [x] DKIM verified on trypinger.com ✅ (confirmed Mar 11)
- [x] SPF configured ✅
- [x] DMARC configured ✅  
- [ ] Instantly.ai account active
- [ ] mario@trypinger.com connected to Instantly.ai
- [ ] Warmup enabled (confirm warmup score ≥ 70 before launch)
- [ ] Prospect CSV uploaded (use `prospect-list-v3.csv` — 324 contacts)
- [ ] PostHog env vars set in Vercel (POSTHOG_API_KEY + POSTHOG_HOST) — Einstein action

---

## CAMPAIGN 1 — PRIMARY COLD OUTREACH (Webflow/Framer agencies)

**Campaign name in Instantly:** `Pinger_Wave1_Webflow_Mar21`  
**From name:** Mario Rossi  
**From email:** mario@trypinger.com  
**Reply-to:** mario@trypinger.com  
**Daily sending limit:** Start at 20/day Mar 21, ramp to 40/day by Mar 28  
**Sending days:** Monday–Friday only  
**Sending window:** 8:00 AM – 5:00 PM ET (covers both PT and ET business hours peak)  
**Time between emails in same campaign:** randomize 3–7 minutes  
**Stop on reply:** YES — critical. If they reply, kill the sequence immediately.

### Sequence (5 steps)

---

**STEP 1 — Day 0 (first send)**

Subject A (split test 50%): `Free Pinger Studio — want in?`  
Subject B (split test 50%): `Quick question about {{company}}'s clients`

Body:
```
Hey {{firstName}},

Found {{company}} on {{source}} — your work on {{specificProject}} is exactly what I had in mind when building this.

I'm Mario, founder of Pinger. Quick version: it's uptime monitoring built specifically for web agencies. The difference from UptimeRobot or Better Stack — your clients get a branded status page. Their logo, their colors, your domain. They check it instead of calling you at midnight.

Looking for 20 agencies to be design partners before we officially launch. The deal:

You get: Free Studio access (normally $79/mo) for 6 months, locked in permanently.
I get: Honest feedback from someone who actually runs an agency.

No sales calls. No obligation. You try it on a real client site, tell me what's broken, and we're square.

Interested?

— Mario
Founder, Pinger 🏓
pingerhq.com
```

*Personalization variables: {{firstName}}, {{company}}, {{source}}, {{specificProject}}*  
*Note: If {{specificProject}} isn't available, use a fallback like "your agency's portfolio" or "the maintenance work you do for clients"*

---

**STEP 2 — Day 4 (no reply to Step 1)**

Subject: `Re: Free Pinger Studio — want in?`  
*(Reply-thread format — treated as a continuation of the same email)*

Body:
```
Hey {{firstName}},

Just bumping this in case it got buried.

One thing I didn't mention — the status page your client sees is public. No login, no app download. You send them a URL once, they bookmark it. That's it.

A few agencies in beta told me the first time their client said "I just checked your status page" instead of calling — that was the moment it clicked.

Still happy to set you up if you want to take it for a spin.

— Mario
Pinger 🏓
```

---

**STEP 3 — Day 9 (no reply to Steps 1–2)**

Subject: `Re: Free Pinger Studio — want in?`

Body:
```
Hey {{firstName}},

Quick one — closing the design partner program this week, we've got the feedback we need from the first cohort.

If you've been curious but not ready to commit: free tier is live at pingerhq.com. One status page, five monitors, no credit card. Takes about five minutes, you'll know quickly if it fits.

Either way — good luck with {{company}}.

— Mario
Pinger 🏓
```

---

**STEP 4 — Day 16 (no reply to Steps 1–3)**  
*This step activates only if they opened ≥ 1 previous email but didn't reply.*  
*In Instantly: enable "send only if opened" condition for this step.*

Subject: `Re: Free Pinger Studio — want in?`

Body:
```
Hey {{firstName}},

One more — only because you opened a couple of these.

Pinger is now out of design partner mode and in public beta. Free tier is still available, no card needed.

If monitoring for your agency clients is something you've been meaning to sort out: pingerhq.com. Genuinely takes 5 minutes to add a site and see a status page live.

No more follow-ups after this.

— Mario
Pinger 🏓
```

---

**STEP 5 — Day 30 (final touchpoint — only for openers who never replied)**  
*Enable "send only if opened" condition. This is a re-engagement, not a cold ask.*

Subject: `[Agency] + Pinger — one last thing`

Body:
```
Hey {{firstName}},

Last one.

We've crossed 50 agencies on Pinger now. The most common thing I hear from agencies after the first week: "I can't believe I was waiting for clients to call me."

If that resonates, the door's still open: pingerhq.com — free tier, no card.

Take care,
— Mario
Pinger 🏓
```

---

## CAMPAIGN 2 — WORDPRESS / MAINTENANCE AGENCIES

**Campaign name in Instantly:** `Pinger_Wave1_WP_Mar21`  
**From name:** Mario Rossi  
**From email:** mario@trypinger.com  
**Daily sending limit:** 15/day (smaller ICP universe)  
**Sending days:** Monday–Friday  
**Sending window:** 8:00 AM – 5:00 PM ET  
**Stop on reply:** YES

### Sequence (3 steps — WP maintenance shops are higher-intent, shorter sequence needed)

**STEP 1 — Day 0**

Subject A: `Your WordPress maintenance clients — quick question`  
Subject B: `Free Pinger Studio for WordPress agencies — want in?`

Body:
```
Hey {{firstName}},

Came across {{company}} — looks like you're running ongoing WordPress maintenance for a solid client base.

I'm building Pinger — uptime monitoring where every client gets a branded status page. They see what's up, what's down, what you're doing about it. The "my site's been down, why didn't you tell me?" conversation stops happening.

20 design partner spots — free Studio access for 6 months in exchange for real feedback.

Interested?

— Mario
Founder, Pinger 🏓
pingerhq.com
```

**STEP 2 — Day 5**

Subject: `Re: Your WordPress maintenance clients — quick question`

Body:
```
Hey {{firstName}},

Bumping this — one thing worth adding.

For WordPress maintenance shops, the status page is especially useful because you're often managing 20–50 client sites simultaneously. When something goes wrong at 11pm, the client usually finds out before you do — and the call starts badly.

With Pinger, they have a page to check instead. You get the alert first, you're already on it when they look. The 11pm panic call becomes a check-in.

Free tier at pingerhq.com if you want to see it in action — one status page, no card.

— Mario
Pinger 🏓
```

**STEP 3 — Day 12**

Subject: `Re: Your WordPress maintenance clients — quick question`

Body:
```
Hey {{firstName}},

Last one.

We've been talking to a lot of WP maintenance shops lately and the feedback is consistent — the ROI isn't from the monitoring, it's from reducing support interrupt time. Agencies say it adds 3–5 hours back per week just from fewer "is my site okay?" check-in calls.

If that's worth testing: pingerhq.com, free tier, five minutes.

Good luck with {{company}}.

— Mario
Pinger 🏓
```

---

## SENDING WINDOWS — RATIONALE

**Why ET (not PT):**
- Most Webflow/Framer/WP agencies are US East Coast or Europe-based
- 8–11 AM ET is prime inbox-checking time for both ET and PT (5–8 AM PT — they'll see it when they open their laptop)
- Avoids landing in the "afternoon pile" when energy is lower

**Recommended daily schedule:**
- Mar 21 (Mon): 20 sends — Campaign 1 only, ease in
- Mar 22–25: 30 sends/day — split Campaign 1 (20) + Campaign 2 (10)
- Mar 28+: 40 sends/day — full ramp if Week 1 deliverability is clean

---

## A/B TEST SETTINGS

In Instantly, enable A/B testing on Step 1 subject lines:

| Variable | Version A | Version B | Winner condition |
|---|---|---|---|
| Subject (C1) | `Free Pinger Studio — want in?` | `Quick question about {{company}}'s clients` | Open rate after 50 sends each |
| Subject (C2) | `Your WordPress maintenance clients — quick question` | `Free Pinger Studio for WordPress agencies — want in?` | Open rate after 30 sends each |

**Stop the losing variant at 100 sends total. Run winner for rest of campaign.**

---

## TRACKING SETTINGS (Instantly.ai)

- **Open tracking:** ON
- **Click tracking:** ON (but note: some email clients block click tracking — open rate is more reliable signal)
- **Unsubscribe link:** ON (required for CAN-SPAM compliance — add to footer)
- **Reply detection:** ON (auto-stop sequence on reply)
- **Bounce handling:** Auto-remove hard bounces. If soft bounce rate >3%, pause and investigate.

**UTM parameters for pingerhq.com links:**
- Campaign 1: `?utm_source=cold-email&utm_medium=instantly&utm_campaign=webflow-wave1`
- Campaign 2: `?utm_source=cold-email&utm_medium=instantly&utm_campaign=wp-wave1`

These let PostHog track which outreach drives signups. Einstein needs POSTHOG_API_KEY set in Vercel for this to work.

---

## REPLY HANDLING (Instantly.ai inbox)

**Target: reply within 2 hours during business hours.**

| Reply type | Response |
|---|---|
| "Yes, interested" | Send onboarding link (pingerhq.com/signup) + offer a 15-min call if they want one. Goal: live on a real client site within 48h. |
| "What is this?" | "It's uptime monitoring for agencies where clients get a branded status page — your logo, your domain. They check it instead of calling you. Want me to set you up?" |
| "Not right now" | "Totally fine — I'll check back in a month. Free tier is live at pingerhq.com if you want to look before then." Mark as nurture. |
| "Not interested" | "Appreciate the reply. If you ever need monitoring, you know where to find us." Mark closed. Do NOT follow up. |
| "Unsubscribe" | Honor immediately. Mark in Instantly. Never contact again. |

---

## WEEK 1 SUCCESS METRICS

| Metric | Day 3 check | Day 7 target |
|---|---|---|
| Open rate | >35% | >42% |
| Reply rate | >5% | >10% |
| Positive reply rate | >2% | >5% |
| Bounce rate | <3% | <3% |
| Design partners confirmed | 2–3 | 8–12 |

**If open rate <25% on Day 3:** Stop sending. DNS issue likely. Verify SPF/DKIM/DMARC before resuming.  
**If bounce rate >5%:** Stop sending. Verify email list with ZeroBounce or NeverBounce before resuming.

---

## WHAT MARIO NEEDS TO DO (step by step)

1. Log into Instantly.ai
2. Create Campaign: `Pinger_Wave1_Webflow_Mar21`
3. Add email account: mario@trypinger.com
4. Set daily limit: 20 (increase to 40 after first 3 days if metrics are clean)
5. Set sending window: Mon–Fri, 8:00 AM – 5:00 PM ET
6. Add sequence: paste Steps 1–5 above with correct timing gaps
7. Enable A/B test on Step 1 subjects
8. Enable: stop on reply, open tracking, click tracking, unsubscribe footer
9. Upload contacts from `prospect-list-v3.csv` — map columns to Instantly variables
10. Set UTM params on all pingerhq.com links
11. Repeat steps 2–10 for Campaign 2 (WP track)
12. **DO NOT click send before Mar 21** — warmup must complete

---
*Instantly.ai campaign config by Gary (CMO) — updated for Mario launch readiness | 2026-03-15*
