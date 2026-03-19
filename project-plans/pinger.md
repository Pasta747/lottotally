# Project Plan: Pinger (pingerhq.com)
**Product:** Website uptime monitoring for agencies
**Pricing:** Freelancer $29/mo | Agency $79/mo | Studio $179/mo | Enterprise $499+/mo
**Owner:** Einstein (build) / Marcus (GTM) / Gary (content)
**Revenue target:** Design partner signups this week → paid conversions by April

---

## Critical Path to Revenue
```
Signup works → Checkout works → Cold emails land → Prospects convert
     ↓              ↓                  ↓                  ↓
   E2 (P0)       E3 (P0)         M3 (Mar 21)      Marcus owns
```

## Tasks

### 🔴 P0 — Revenue Blocking
| # | Task | Owner | Due | Depends On | Status |
|---|------|-------|-----|------------|--------|
| E2 | Verify signup grants product access (not waitlist) | Einstein | Mar 19 | — | ✅ Done — Verified Mar 19 |
| E3 | Verify all checkout routes work e2e (FREELANCER/AGENCY/STUDIO/ENTERPRISE → Stripe) | Einstein | Mar 19 | E2 | ✅ Done — Verified Mar 19 |
| M3 | Confirm Instantly fully warm + sequences loaded + contacts ready for Mar 21 launch | Marcus | Mar 20 | — | 🔄 Verifying |

### 🟡 P1 — High Impact
| # | Task | Owner | Due | Depends On | Status |
|---|------|-------|-----|------------|--------|
| E6 | Website redesign (Crusoe-quality, `clean` design system) | Einstein | Mar 22 | — | 🔄 In Progress |
| E-fix | Fix demo/status page (/status/smith-digital returns 404) | Einstein | Mar 21 | E6 | ❌ Not Started |
| G3 | Pinger launch assets (social proof, demo content for cold email) | Gary | Mar 20 | — | ✅ Done — 5/5 shipped: QA checklist, Proof Kit, One-pager, Trust Snippets, Demo Polish Notes. Offer language aligned to approved tiers (commit d0c2e1f). Verified Mar 19 |
| G-social | Start consistent @pingerhq posting schedule | Gary | Mar 21 | — | ✅ Done — 5 tweets scheduled via cron (Mar 19-20), posting plan + weekly cadence committed (8b16ecb). Verified Mar 19 |

### 🟢 P2 — This Week
| # | Task | Owner | Due | Depends On | Status |
|---|------|-------|-----|------------|--------|
| M-reply | Reply templates for cold email responses | Marcus | Mar 21 | — | ✅ Done — `strategy/pinger-reply-playbook.md`, 8 scenarios + Stripe coupon flow. Verified Mar 19 |
| G-video | Publish demo video (script ready) | Gary | Mar 24 | E-fix | ❌ Not Started |

## Infrastructure Status
| Item | Status | Verified | Notes |
|------|--------|----------|-------|
| Domain live | ✅ Done | Mar 19 | pingerhq.com returns 200 |
| Signup page | ✅ Done | Mar 19 | /signup returns 200 |
| Stripe env vars in Vercel | ✅ Done | Mar 19 | 7 Stripe vars in production |
| Checkout routes exist | ✅ Done | Mar 19 | /checkout/AGENCY returns 200 |
| Checkout → Stripe session | ✅ Done | Mar 18 | Einstein API-tested, valid Stripe URL |
| Stripe webhook handler | ✅ Done | — | route.ts exists |
| Blog (3 posts) | ✅ Done | Mar 19 | /blog 200, 3 posts with SEO meta |
| PostHog analytics | ✅ Done | Mar 19 | Key in Vercel production |
| Vercel deployment | ✅ Done | Mar 18 | Deployed via VERCEL_TOKEN |
| Demo/status page | ❌ Broken | Mar 18 | /status/smith-digital 404 |

## Outreach Status
| Item | Status | Verified | Notes |
|------|--------|----------|-------|
| Instantly API key | ✅ Done | Mar 19 | In .env |
| Campaigns created | ✅ Done | Mar 18 | WP + Webflow, status=0 (warming) |
| Email sequences loaded | ✅ Done | Mar 18 | Recreated via API |
| 30 prospects uploaded | ✅ Done | Mar 18 | 21 WP, 9 Webflow, validated |
| Domain warmup | 🔄 In Progress | — | Started Mar 7 → Mar 21 |
| Cold email launch | 📅 Mar 21 | — | Friday |

## Key Files
- Code: `/root/PastaOS/products/pinger/`
- Vercel: prj_DDB2GbxXdCLhWGRUUBTn9Wrojp91 (token in /root/PastaOS/.env)
- Instantly campaigns: Pinger_Wave1_WP_Mar21, Pinger_Wave1_Webflow_Mar21
- Social copy: Gary's workspace
- Demo script: `content/pinger-demo-script.md` (Gary)
