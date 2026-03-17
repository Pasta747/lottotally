---
name: x-automation
description: Automates the process of identifying trends on X (Twitter), generating opinionated/engaging content, and posting it via the X API. Use when asked to post to X, run X automation, or check trends for content creation.
---

# X (Twitter) Automation Skill

This skill provides a structured workflow for generating and posting high-engagement content on X.

## Posting Tool

Use the X API posting tool directly — no browser required:
```bash
node /root/PastaOS/tools/x-api/post.mjs --account <pingerhq|canopyfilter> --text "Your tweet"
```

## Workflow

1.  **Context Gathering**:
    -   Use `web_search` to check current trending topics and discourse in relevant niches.
    -   Check recent posts from competitors/peers for tone calibration.
2.  **Trend Identification**:
    -   Identify 3-5 relevant trends from search results.
    -   Focus on topics aligned with the brand being posted for (Pinger = agencies/SaaS/monitoring, Canopy = creators/YouTube/content moderation).
3.  **Content Generation**:
    -   Generate **3 candidate tweets**.
    -   **Constraint**: Opinions are encouraged! Be bold, witty, or opinionated to drive engagement.
    -   Include relevant hashtags but keep them minimal (1-2).
    -   **Gary review gate**: All content must be approved by Gary (CMO) before publishing.
4.  **Rate Limit Awareness**:
    -   New accounts throttle hard: ~2-3 tweets per rate window before 403s.
    -   Drip/queue content across the day/week — never burst-post.
    -   X requires pay-per-use credits ($5/account purchased).
5.  **Publication**:
    -   Post via the API tool (see above).
    -   Log result to `memory/x-daily-candidates.log`.
6.  **Notification**:
    -   Notify the user of success or failure.

## Accounts

| Account | Brand | Credentials |
|---------|-------|-------------|
| pingerhq | Pinger | OAuth 1.0a Read+Write |
| canopyfilter | Canopy Filter | OAuth 1.0a Read+Write |

## Profile Updates

Profile image/bio updates available via v1.1 API methods (`updateAccountProfile`, `updateAccountProfileImage`) — no browser needed.

## Content Style Guide

-   **Concise**: Keep it punchy.
-   **Opinionated**: Don't just report facts; give a "hot take".
-   **Engaging**: Use questions or strong statements to prompt replies.
-   **Brand-appropriate**: Pinger = professional/agency-focused, Canopy = empathetic/creator-focused.
