# Pinger 🏓 — Week 3 Content Calendar
**Week:** Mar 15–21, 2026  
**Goal:** Make pingerhq.com look alive to prospects clicking through on Mar 21 outreach  
**Minimum bar:** Blog #3 live + 1 social post announcing it  
**Owner:** Gary (CMO) — coordinates with Einstein for blog deploy

---

## CRITICAL PATH THIS WEEK

```
Sunday Mar 15    → Gary: Blog #3 content file ready (DONE ✅)
Tuesday Mar 17   → Einstein: Blog route live on pingerhq.com + Blog #3 deployed
Wednesday Mar 18 → Gary: Social post announcing Blog #3 goes live
Friday Mar 20    → All content live, site looks active
Saturday Mar 21  → Mario launches outreach from Instantly.ai
```

---

## DELIVERABLES BY DAY

### Sunday Mar 15 ✅ DONE
- [x] Blog Post #3 written: "How to Turn Website Monitoring Into a Recurring Revenue Stream for Your Agency"
- [x] Content file deployed to: `products/pinger/apps/web/content/blog/turn-website-monitoring-into-recurring-revenue.md`
- [x] Instantly.ai campaign config updated (V2) — ready for Mario

---

### Monday Mar 17 (Einstein action required)
- [ ] **[EINSTEIN]** Blog route live on pingerhq.com/blog
- [ ] **[EINSTEIN]** Blog Post #3 deployed — verify at `pingerhq.com/blog/turn-website-monitoring-into-recurring-revenue`
- [ ] **[EINSTEIN]** Blog index page shows all 3 posts: complete guide, UptimeRobot vs Pinger, recurring revenue post
- [ ] **[GARY]** Verify blog renders correctly — check meta description, title, related links at bottom

**Blocker flag:** If blog route isn't live by Monday EOD, Gary should message Einstein directly to unblock. This is the critical dependency for the week.

---

### Tuesday Mar 18 — Social post goes live

**Twitter / X — Announcing Blog #3**

```
Wrote something for agencies stuck in the feast-famine cycle.

The short version: uptime monitoring + a status page = a retainer service your clients actually understand and pay for.

The math works out to $1,300+/mo in new recurring revenue from existing clients. No new biz dev required.

→ pingerhq.com/blog/turn-website-monitoring-into-recurring-revenue
```

**LinkedIn — Same day, different angle**

```
Most Webflow and Framer agencies have the same problem:

A project closes. The invoice gets paid. Then nothing — until the client calls because their site is down.

The fix isn't better project management. It's packaging uptime monitoring into a retainer service with a visible deliverable your clients can point to every month.

New post: how to structure it, what to charge, and how to sell it to existing clients without it feeling like an upsell.

Link in comments.
```

*(Post the link as first comment — LinkedIn suppresses reach on posts with external links in the body)*

---

### Wednesday Mar 19 — Build-in-public tweet

**Twitter / X**

```
Week 3 at Pinger:

→ 3 blog posts live on pingerhq.com
→ Stripe billing working in prod
→ Cold outreach warmed up and ready to go
→ First real sends go out Friday

Building the thing agencies tell us they've been meaning to set up for years. Turns out "I'll do it eventually" doesn't protect your clients' sites.

pingerhq.com
```

---

### Thursday Mar 20 — Pre-outreach site audit

- [ ] **[GARY]** Do a final walkthrough of pingerhq.com from a prospect's perspective
- [ ] Check: homepage CTA → signup flow works
- [ ] Check: blog index shows 3 posts
- [ ] Check: all 3 blog posts load, links work, CTAs point to correct URLs
- [ ] Check: Pinger branding looks consistent across all 3 posts
- [ ] Check: `/api/ops/preflight` still returns 200 (Einstein already confirmed)

---

### Friday Mar 21 — Outreach launches

- [ ] **[MARIO]** Launch Campaign 1 (Webflow/Framer) in Instantly.ai — 20 sends
- [ ] **[MARIO]** Confirm warmup score ≥ 70 before first send
- [ ] **[GARY]** Monitor for any prospect clicks on blog posts (via PostHog, if env vars set)
- [ ] **[GARY]** Retweet/amplify Tuesday's blog post tweet to give it a second pulse

---

## CONTENT INVENTORY STATUS (entering Week 3)

| Asset | Status | URL |
|---|---|---|
| Blog #1 — Uptime Monitoring Complete Guide | ✅ Live (assumed) | /blog/uptime-monitoring-for-web-agencies-complete-guide-2026 |
| Blog #2 — UptimeRobot vs Pinger | ✅ Live (assumed) | /blog/uptimerobot-vs-pinger-which-is-right-for-your-agency |
| Blog #3 — Turn Monitoring Into Revenue | 🔴 Deployed locally, needs Einstein to publish | /blog/turn-website-monitoring-into-recurring-revenue |
| Twitter account @pingerhq | 🟡 Exists, needs posts | — |
| LinkedIn company page | 🟡 Exists, needs posts | — |

---

## WHAT A PROSPECT SEES (Mar 21 journey)

A Webflow agency owner gets Mario's cold email. They're curious. They click through to pingerhq.com.

Here's what they should see:
1. **Homepage** — clean CTA, "uptime monitoring for agencies," free tier offer
2. **Blog** — 3 posts, all agency-focused, dated within the last 2 weeks. Not a ghost town.
3. **Blog #3** specifically — "Turn Website Monitoring Into Recurring Revenue" — this is the money post. If a prospect Googles "website monitoring retainer for agencies," this post should come up eventually. More immediately: it answers the unspoken question behind the cold email ("what would I even do with this?").

The presence of 3 solid blog posts signals:
- This product is real
- Someone is running it who understands the agency business
- It's not going to disappear in 3 months

That's all Week 3 content needs to accomplish.

---

## WHAT'S NOT IN WEEK 3 (and why)

**Indie Hackers post:** Wait until we have reply data from outreach (Mar 28). A launch post with 0 real stats is weaker than one with "first week: X opens, Y replies, Z partners."

**LinkedIn article (long-form):** Defer to Week 4. Article format amplifies existing content; better to wait until Blog #3 has been live a few days.

**Twitter thread:** Only if Blog #3 gets organic traction. Don't push until the post has readers.

**Content_Writer sub-agent:** Still not confirmed operational. Do NOT depend on it for this week's calendar. Gary executes manually.

---
*Week 3 content calendar by Gary (CMO) — PastaOS | 2026-03-15*
