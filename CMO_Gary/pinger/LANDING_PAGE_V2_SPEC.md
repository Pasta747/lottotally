# Pinger Landing Page V2 Spec

## Goal
Rework the current landing page so it sells Pinger to **agencies** first.

The page should make one thing obvious within 5 seconds:

**Pinger helps agencies look organized, proactive, and trustworthy when client sites go down.**

This is not a generic uptime tool landing page. The emotional buy is:
- I can see everything across clients fast
- My team gets alerted before the client notices
- My clients get a clean status page instead of sending me panicked messages

The **status page screenshot is the hero asset** because that is the part the agency’s client actually sees.

---

## Assets
Use these screenshot files:

- Dashboard: `/root/PastaOS/products/pinger/assets/screenshots/dashboard.png`
- Status page: `/root/PastaOS/products/pinger/assets/screenshots/status-page.png`
- Alerts / monitor detail: `/root/PastaOS/products/pinger/assets/screenshots/monitor-detail.png`

Recommended implementation path:
- Copy these into a web-accessible location such as `apps/web/public/screenshots/`
- Then render with `next/image`

Suggested public paths:
- `/screenshots/dashboard.png`
- `/screenshots/status-page.png`
- `/screenshots/monitor-detail.png`

---

## Current Page Review
Source reviewed: `/root/PastaOS/products/pinger/apps/web/app/page.tsx`

### What the current page gets right
- Clean structure
- Good simple nav + CTA
- Waitlist form already exists
- Agency positioning is partially there
- FAQ already reflects white-label/client-facing value

### What is not strong enough
1. **Hero is too generic**
   - Current headline: `Status pages your clients will actually open.`
   - It is decent, but it underplays the agency pain and the “I look good to my clients” outcome.
   - It also doesn’t leverage the strongest visual proof: the status page screenshot.

2. **Hero visual is a placeholder component, not the real product**
   - `ProductPreview` is a mocked UI card.
   - For conversion, the real screenshots will beat a stylized mock every time.

3. **“How it works” comes too early**
   - The current page goes Hero → How it works → Feature highlights.
   - That makes the page feel explanatory before it feels desirable.
   - We need Hero → Product proof → Product proof → Product proof.

4. **Feature cards are too abstract**
   - Current cards:
     - Branded Status Pages
     - 1-Minute Monitoring
     - Multi-Channel Alerts
   - These are true, but they are commodity-sounding without screenshots beside them.

5. **No screenshot-led story**
   - The landing page should visually tell this exact sequence:
     - You monitor everything in one place
     - Your client gets a beautiful status page
     - Your team gets alerted immediately

6. **Pricing is too early for the current level of proof**
   - Pricing can stay on the page, but only after the screenshot-led sections and social proof placeholder.

---

## Recommended New Section Order
1. Header
2. Hero with **status page screenshot**
3. Product section 1 — Dashboard screenshot
4. Product section 2 — Status page screenshot
5. Product section 3 — Alerts / monitor detail screenshot
6. Social proof placeholder
7. “How it works” (optional simplified version, or remove entirely)
8. Pricing
9. FAQ
10. Footer

### Recommendation on “How it works”
**Option A (preferred):** Keep it, but move it below social proof and above pricing.
- By then the visitor already understands the product visually.
- The section becomes reinforcement instead of homework.

**Option B:** Remove it entirely if the screenshot sections make the story clear enough.
- If Einstein wants a tighter page, this is the first section I would cut.

---

## Exact Copy — Hero

### Eyebrow
**Monitoring for agencies**

### Headline
**The status page your clients check instead of texting you.**

### Subhead
**Pinger monitors every client site, alerts your team fast, and gives clients a clean status page they can trust — so you spend less time answering “is the site down?” and more time fixing it.**

### CTA
Primary button text can stay:
- **Start Free — No Credit Card**

Optional secondary CTA if one is added later:
- **See a sample status page**

### Hero supporting chips
Replace current chips with:
- **1-minute checks**
- **Client-ready status pages**
- **White-label ready**

### Hero visual
Use: **status-page.png**

#### Placement
- Right side on desktop, under copy on mobile
- This replaces `ProductPreview` in the hero

#### Treatment
- Large screenshot framed in a rounded device/browser-style container
- Rounded corners: 20px to 24px
- Border: light neutral border
- Shadow: soft but visible, enough to make the screenshot feel premium
- Background behind image: subtle off-white or very light gray, not a loud gradient
- Optional small floating badge in corner:
  - `Branded for your client`
  - Keep subtle; do not clutter screenshot

#### Size guidance
- Desktop: visually dominant, roughly 52–58% of the hero width allocation on large screens
- Mobile: full width, centered, enough margin above/below to breathe

#### Why this is the hero
Because this is the part agencies show clients. It sells trust, polish, and professionalism in one glance.

---

## Product Section 1 — Dashboard

### Purpose
Show the operational value for the agency team.

### Section label
**Dashboard**

### Headline
**See everything at a glance.**

### Body copy
**Track every client site in one view, spot issues fast, and know what needs attention without hopping between tools. Pinger gives your team a clear operating picture the moment something changes.**

### Supporting bullets
- **All client monitors in one place**
- **Fast scan of uptime and current status**
- **Built for agencies managing multiple sites**

### Screenshot
Use: **dashboard.png**

### Layout
- Desktop: screenshot on the **left**, copy on the **right**
- Mobile: copy first, screenshot second is acceptable, but screenshot should appear immediately after the text with minimal gap

### Treatment
- Large screenshot inside rounded card/container
- Light border + soft shadow
- No aggressive overlays
- If any callout badge is added, use one only:
  - `All client sites in one dashboard`

### Size guidance
- Screenshot should be the main weight of the section
- Around 55% visual width for image / 45% for text on desktop

---

## Product Section 2 — Status Page

### Purpose
This is the trust/conversion section. Even though the screenshot also appears in hero, it deserves its own section because it is the most differentiated value.

### Section label
**Status pages**

### Headline
**Beautiful status pages your clients will love.**

### Body copy
**Give every client a clean, branded place to check system health, follow incidents, and see updates without emailing your team for answers. When something breaks, clients stay informed and your agency looks prepared.**

### Supporting bullets
- **Branded for your agency or client**
- **Clear incident updates and history**
- **A calmer client experience during outages**

### Screenshot
Use: **status-page.png**

### Layout
- Desktop: copy on the **left**, screenshot on the **right**
- This can mirror the hero composition, but make the section tighter and more product-focused

### Treatment
- Same premium screenshot treatment as hero
- Consider a darker surrounding card background only if it helps the screenshot pop; do not reduce readability
- Optional micro-caption beneath screenshot:
  - **What your client sees during an incident**

### Size guidance
- Slightly smaller than hero, but still a major visual
- Keep enough width that the UI details remain legible

### Important note
This section should reinforce the message that agencies are not buying monitoring alone.
They are buying **fewer panicked messages, better client communication, and a more professional experience when things go wrong**.

---

## Product Section 3 — Alerts

### Purpose
Show speed and proactivity.

### Section label
**Alerts**

### Headline
**Know before your clients do.**

### Body copy
**Get alerted the moment a site has trouble so your team can investigate fast, update the client-facing status page, and stay one step ahead of the next “hey, our site is down” message.**

### Supporting bullets
- **Immediate visibility when a monitor changes**
- **Investigate incidents without digging around**
- **Respond faster and look more proactive**

### Screenshot
Use: **monitor-detail.png**

### Layout
- Desktop: screenshot on the **right**, copy on the **left**
- If alternating layout feels cleaner with dashboard left / status right / alerts left, that is fine. Main rule: keep visual rhythm and avoid monotony.

### Treatment
- Rounded card with border and shadow
- If the screenshot includes incident detail, allow a little more crop space so the incident context is readable
- Optional small annotation/callout near the screenshot:
  - `Catch issues early`

---

## Social Proof Placeholder Section

### Purpose
Reserve space for future design partner proof without faking it.

### Section headline
**Built for agencies that want to look sharp when things break.**

### Body copy
**We’re onboarding design partners now. Soon this section will feature agencies using Pinger to monitor client sites, reduce support noise, and give clients a better status experience.**

### Optional placeholder cards
Use 2–3 muted placeholder cards such as:
- **Design partner spot**
- **Agency case study coming soon**
- **Early customer quote coming soon**

### Styling note
Make this feel intentional, not empty.
- Light gray background section is fine
- Lower visual contrast than the screenshot sections
- Avoid fake logos or invented metrics

---

## How It Works Section

### Recommendation
If kept, simplify the copy to match the new positioning.

### Revised copy
1. **Add your client sites**  
   Paste in a URL and start monitoring in minutes.

2. **Brand the status page**  
   Add your logo, colors, and custom domain.

3. **Share one client-ready link**  
   Clients check the page instead of asking your team for updates.

### Why this version works better
It is more outcome-oriented and aligned with the screenshot story.

---

## Pricing Section

### Recommendation
Keep pricing after the screenshot-led proof sections.

### Minor copy addition above pricing
Add a short intro line above the pricing cards:

**Start free, then upgrade when you need branded pages, more monitors, or full white-label.**

No major pricing table rewrite needed in this pass unless Mario/Gary want plan messaging tightened later.

---

## FAQ Section
Current FAQ is solid and can mostly stay.

### Recommended FAQ tweaks
Current FAQ answers are fine, but slightly tighten the first and fourth answers.

#### Replace:
**How is this different from UptimeRobot?**  
`Pinger combines uptime monitoring with beautiful client-facing status pages built for agency-client trust.`

With:  
**Pinger is built for agencies, not just internal ops teams. You get uptime monitoring plus clean client-facing status pages that reduce support noise and help you communicate better during incidents.**

#### Replace:
**What happens when a site goes down?**  
`Pinger detects downtime, alerts your team, and updates the public status page incident timeline automatically.`

With:  
**Pinger detects the issue, alerts your team fast, and gives you a clear place to communicate status updates so clients know what’s happening without chasing you down.**

---

## Specific Implementation Changes Needed in `page.tsx`

### 1. Replace hero copy
Current:
- Eyebrow: `Pinger`
- Headline: `Status pages your clients will actually open.`
- Subhead: current paragraph about 1-minute monitoring and avoiding calls

Replace with:
- Eyebrow: `Monitoring for agencies`
- Headline: `The status page your clients check instead of texting you.`
- Subhead: `Pinger monitors every client site, alerts your team fast, and gives clients a clean status page they can trust — so you spend less time answering “is the site down?” and more time fixing it.`

### 2. Replace `ProductPreview` in hero
Current hero uses:
- `<ProductPreview />`

Change to:
- Real screenshot render for `status-page.png`
- Can be done inline or through a reusable screenshot component

### 3. Update chip copy
Current chips:
- `1-minute checks`
- `Branded status pages`
- `White-label ready`

Replace with:
- `1-minute checks`
- `Client-ready status pages`
- `White-label ready`

### 4. Move or remove “How it works”
Current location:
- Immediately below hero

Change:
- Move below social proof placeholder and above pricing
- Or remove if page length needs tightening

### 5. Remove current “Feature highlights” card section
Current section title:
- `Feature highlights`

Recommendation:
- Remove this section entirely
- Replace it with three screenshot-led product sections:
  1. Dashboard
  2. Status pages
  3. Alerts

Reason:
- The new sections do the same job with much stronger proof

### 6. Insert new screenshot-led sections after hero
Add three sections in this order:
1. Dashboard — `dashboard.png`
2. Status pages — `status-page.png`
3. Alerts — `monitor-detail.png`

### 7. Insert social proof placeholder section before pricing
This should sit after the product sections and before How It Works / Pricing.

### 8. Keep pricing, FAQ, footer
No major structural rewrite needed there for this pass.

---

## Suggested Component Structure
Einstein can implement this cleanly by replacing the mock preview with reusable screenshot sections.

### Option A: Keep it simple in `page.tsx`
Add sections inline with repeated layout blocks.

### Option B: Better approach
Create reusable components like:
- `LandingScreenshot`
- `LandingFeatureSection`
- `SocialProofPlaceholder`

Possible props:
- `eyebrow`
- `title`
- `body`
- `bullets`
- `imageSrc`
- `imageAlt`
- `imageLeft` boolean
- `caption`

This will make future copy/asset swaps easier.

---

## Screenshot Styling Spec

### Shared visual rules
All screenshots should feel like polished product proof.

Use:
- Rounded corners: `rounded-2xl` or equivalent
- Border: light gray, subtle
- Shadow: stronger than cards, softer than a dramatic hero shadow
- Padding: enough that screenshots do not feel cramped
- Background: white or very light neutral container

### Do not do
- Do not place screenshots in a fake laptop mockup
- Do not use heavy gradients behind every screenshot
- Do not add multiple floating badges per image
- Do not crop so tightly that UI labels become unreadable

### Alt text suggestions
- Hero / status page: `Branded Pinger status page showing incident updates for a client site`
- Dashboard: `Pinger dashboard showing multiple client monitors and uptime status`
- Alerts / monitor detail: `Pinger monitor detail view showing an active incident and alert context`

---

## Mobile Considerations
This matters a lot because many agency owners will first open from social or mobile.

### Hero
- Stack copy above screenshot
- Keep headline to 3–4 lines max on mobile
- Do not let screenshot become a tiny thumbnail
- Waitlist form should remain easy to fill without crowding the hero

### Screenshot sections
- Use a consistent vertical rhythm:
  - eyebrow
  - headline
  - body
  - bullets
  - screenshot
- Keep each screenshot full-width within the content column
- Add enough top margin before screenshots so the text does not crash into the image

### Social proof placeholder
- Stack cards vertically
- Keep copy short so this section does not feel like filler

### Pricing
- Existing multi-column pricing cards will likely stack; that is fine
- Ensure the page does not feel like screenshots are premium but pricing is an afterthought

---

## Tone Rules for Implementation
- Speak to **agency owners and operators**
- Clear over clever
- No generic SaaS fluff
- No “peace of mind,” “streamline,” “powerful platform,” or “mission-critical visibility” language
- Keep the promise believable
- Focus on reducing client chaos and improving agency professionalism

---

## Final Recommended Page Flow
1. **Hero**
   - Agency-focused headline
   - Waitlist CTA
   - Hero screenshot = status page
2. **Dashboard section**
   - “See everything at a glance”
3. **Status page section**
   - “Beautiful status pages your clients will love”
4. **Alerts section**
   - “Know before your clients do”
5. **Social proof placeholder**
6. **How it works** (moved lower or removed)
7. **Pricing**
8. **FAQ**
9. **Footer**

---

## Copy Block Summary

### Hero
**Monitoring for agencies**

**The status page your clients check instead of texting you.**

**Pinger monitors every client site, alerts your team fast, and gives clients a clean status page they can trust — so you spend less time answering “is the site down?” and more time fixing it.**

### Dashboard section
**Dashboard**

**See everything at a glance.**

**Track every client site in one view, spot issues fast, and know what needs attention without hopping between tools. Pinger gives your team a clear operating picture the moment something changes.**

### Status page section
**Status pages**

**Beautiful status pages your clients will love.**

**Give every client a clean, branded place to check system health, follow incidents, and see updates without emailing your team for answers. When something breaks, clients stay informed and your agency looks prepared.**

### Alerts section
**Alerts**

**Know before your clients do.**

**Get alerted the moment a site has trouble so your team can investigate fast, update the client-facing status page, and stay one step ahead of the next “hey, our site is down” message.**

### Social proof placeholder
**Built for agencies that want to look sharp when things break.**

**We’re onboarding design partners now. Soon this section will feature agencies using Pinger to monitor client sites, reduce support noise, and give clients a better status experience.**

---

## Bottom Line
If Einstein implements only three changes, they should be these:
1. Replace the hero mockup with the real **status page screenshot**
2. Replace the generic feature cards with **three screenshot-led product sections**
3. Reorder the page so **proof comes before pricing**

That will make the page feel much more real, much more agency-specific, and much more likely to convert.
