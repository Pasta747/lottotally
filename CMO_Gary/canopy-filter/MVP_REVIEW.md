# Canopy MVP Review

## Verdict
**Approved to ship.**

Einstein applied the six landing-page copy fixes correctly. The product is now honest about what is live, the brand voice is largely intact, and nothing I found is ship-blocking.

---

## What's good

### Landing page
All 6 requested fixes were applied correctly:
1. **Platform support was de-risked**
   - "Multi-platform, rolling out" is in place
   - YouTube-first language is now accurate
   - FAQ no longer implies everything is fully live across platforms

2. **Exact setup-time claims were softened**
   - "Set it up once. Feel the difference right away." is live
   - "Get started fast." replaced sharper time claims
   - "Setup is quick." is appropriately non-fragile

3. **Roadmap features are labeled honestly**
   - "Weekly community digest — rolling out in beta"
   - "Response drafts in your voice — coming soon"
   - "Monthly community report — coming soon"

4. **Pricing section is launch-safe**
   - "Start free" section is correctly in place
   - No premature paid-plan detail
   - "No credit card required" is the right friction remover here

5. **Moderation claims are no longer too absolute**
   - "filtered by default" replaced "never shown"
   - Much more credible

6. **Placeholder testimonials were removed**
   - Replaced with the founder-note block
   - Much safer and more trustworthy

### Overall brand tone
- The hero is strong: protective without sounding paranoid
- The core promise is clear: stay close to your community without absorbing unnecessary harm
- The copy avoids sounding like generic "AI moderation software"
- The page feels more creator-first than tool-first, which is right for Canopy

### Dashboard
- Structure is clean and understandable
- The filter flow is simple enough for MVP
- The default category architecture is easy to grasp
- Empty state exists, which is good

### Classifier
- The four-category system is workable for MVP: **toxic / spam / constructive / positive**
- Prompt is simple and clear enough for a first pass
- The definitions are directionally right
- Heuristic fallback exists, which is operationally smart

---

## What needs fixing

### 1) Dashboard title feels too internal / generic
**Current:**
> Canopy Dashboard

**Replace with:**
> Canopy

**Why:**
"Canopy Dashboard" sounds like admin software. The product voice should feel calmer and more consumer-facing.

**Priority:** Nice-to-have

---

### 2) "Back to Landing" is awkward product language
**Current:**
> Back to Landing

**Replace with:**
> Back to home

**Why:**
"Landing" is internal marketing language. Users don't think in those terms.

**Priority:** Nice-to-have

---

### 3) Summary section label is too analytics-y for the brand
**Current:**
> Summary stats

**Replace with:**
> Comment overview

**Why:**
"Summary stats" sounds like a generic dashboard component. "Comment overview" feels more human and product-specific.

**Priority:** Nice-to-have

---

### 4) Category labels should be title-cased in the UI
**Current:**
> toxic
n> spam
> constructive
> positive

**Replace with:**
> Toxic
> Spam
> Constructive
> Positive

**Why:**
Lowercase labels read like raw enum values, not product UI.

**Priority:** Nice-to-have

---

### 5) "Filtered comment feed" is colder than the rest of the brand
**Current:**
> Filtered comment feed

**Replace with:**
> Comment review

**Why:**
"Filtered comment feed" sounds mechanical. "Comment review" feels calmer and more aligned with Canopy's protective tone.

**Priority:** Nice-to-have

---

### 6) Empty state could feel more supportive
**Current:**
> No comments in this category for the selected video.

**Replace with:**
> Nothing in this category for this video right now.

**Why:**
A little softer, a little less robotic.

**Priority:** Nice-to-have

---

### 7) Classifier labels are acceptable for MVP, but note the brand boundary
**Current categories:**
> toxic / spam / constructive / positive

**Recommendation:**
Keep them for MVP **internally**.

If these labels become highly visible in creator-facing surfaces later, test this alternative:
> harmful / spam / constructive / supportive

**Why:**
"Toxic" is blunt but operationally clear. Fine for an internal review tool. If Canopy evolves into a more emotionally intelligent creator product, "harmful" and "supportive" may fit the brand better.

**Priority:** Nice-to-have

---

### 8) Heuristic fallback is slightly biased toward over-classifying neutral comments as constructive
**Current fallback default:**
> constructive

**Suggested future replacement behavior:**
Add a fifth internal-only label later:
> neutral

If keeping 4 labels only for now, leave as-is.

**Why:**
Not a launch issue, but neutral comments being forced into constructive will skew the dashboard.

**Priority:** Nice-to-have

---

## Notes on classifier prompt quality
The current prompt is good enough for launch. The category definitions are readable and operational.

Best current line:
> toxic: insults, harassment, abuse, demeaning attacks

That said, if you want a cleaner future version, this is the stronger wording:

**Suggested future prompt copy:**
> Classify each YouTube comment into exactly one category:
> - toxic: harassment, cruelty, personal attacks, demeaning or abusive language
> - spam: scams, self-promotion, irrelevant solicitation, repeated promotional content
> - constructive: respectful criticism, suggestions, disagreement, or useful feedback
> - positive: praise, encouragement, gratitude, warmth, or clear support

**Priority:** Nice-to-have

---

## Final sign-off
**Ship it.**

The review gate passes.

The landing page is materially improved and now says what the product can honestly support today. The dashboard and classifier are good enough for MVP. Remaining issues are polish-level, not blockers.