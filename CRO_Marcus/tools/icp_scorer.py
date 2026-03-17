#!/usr/bin/env python3
"""
ICP Cross-Reference Scorer for Pinger Prospects
Scores 324 contacts against Pinger ICP criteria and outputs ranked top 30.
"""

import csv
import json
import re
import sys

INPUT = "/root/PastaOS/CMO_Gary/pinger/prospect-list-MASTER.csv"
OUTPUT_MD = "/root/PastaOS/CRO_Marcus/research/icp-ranked-prospects.md"
OUTPUT_JSON = "/root/PastaOS/CRO_Marcus/research/icp-ranked-prospects.json"

# ICP scoring weights
CATEGORY_SCORES = {
    "wordpress-maintenance": 30,  # Perfect fit - they manage client sites
    "wordpress-agency": 25,       # Build + maintain WordPress sites
    "webflow-agency": 25,         # Webflow shops - strong ICP fit
    "framer-agency": 22,          # Framer shops - good fit
    "web-design": 10,             # Generic - could be anything
}

# Keywords in personalization_note that signal strong ICP fit
STRONG_FIT_KEYWORDS = [
    (r"maintenance|care plan|retainer|managed\s+hosting|support plan", 15, "maintenance/retainer model"),
    (r"white[\s-]?label|whitelabel|client[\s-]?facing|branded", 10, "white-label interest"),
    (r"wordpress|wp\s|wp-", 8, "WordPress focus"),
    (r"webflow", 8, "Webflow focus"),
    (r"framer", 7, "Framer focus"),
    (r"agency|agencies", 5, "agency model"),
    (r"client|customer", 5, "client-focused"),
    (r"monitoring|uptime|status\s+page|downtime", 20, "already thinking about monitoring"),
    (r"saas|tool|product", 3, "builds tools"),
    (r"ecommerce|e-commerce|shopify", 4, "ecommerce (secondary fit)"),
    (r"founder|ceo|owner|coo|director|head\s+of|vp\s|chief", 5, "decision-maker title in note"),
]

# Negative signals
NEGATIVE_KEYWORDS = [
    (r"enterprise|fortune\s+500|corporate", -10, "enterprise focus"),
    (r"devops|infrastructure|platform\s+engineering", -8, "devops-focused"),
    (r"mobile\s+app|ios|android", -5, "mobile-focused"),
    (r"marketing\s+only|seo\s+only|ads\s+only", -5, "marketing-only agency"),
]

def score_prospect(row):
    """Score a single prospect against ICP criteria."""
    score = 0
    reasons = []
    
    category = row.get("category", "").strip().lower()
    confidence = 0
    try:
        confidence = int(row.get("confidence", "0").strip())
    except ValueError:
        confidence = 50
    
    is_dm = row.get("is_decision_maker", "").strip().upper() == "YES"
    priority = row.get("priority", "").strip().upper()
    note = row.get("personalization_note", "").strip().lower()
    position = row.get("position", "").strip().lower()
    
    # 1. Category score (0-30)
    cat_score = CATEGORY_SCORES.get(category, 5)
    score += cat_score
    reasons.append(f"category:{category}(+{cat_score})")
    
    # 2. Decision maker (0-15)
    if is_dm:
        score += 15
        reasons.append("decision-maker(+15)")
    
    # 3. Confidence score (0-10, normalized)
    conf_score = round((confidence / 100) * 10)
    score += conf_score
    reasons.append(f"confidence:{confidence}(+{conf_score})")
    
    # 4. Priority (0-5)
    if priority == "HIGH":
        score += 5
    reasons.append(f"priority:{priority}")
    
    # 5. Keyword analysis on personalization note
    for pattern, pts, label in STRONG_FIT_KEYWORDS:
        if re.search(pattern, note, re.IGNORECASE):
            score += pts
            reasons.append(f"{label}(+{pts})")
    
    # 6. Negative signals
    for pattern, pts, label in NEGATIVE_KEYWORDS:
        if re.search(pattern, note, re.IGNORECASE):
            score += pts  # pts is negative
            reasons.append(f"{label}({pts})")
    
    # 7. Position/title bonus for founder/CEO/owner
    if re.search(r"founder|ceo|owner|coo|managing\s+director|principal", position, re.IGNORECASE):
        score += 5
        reasons.append("c-level-title(+5)")
    
    return score, reasons

def main():
    prospects = []
    
    with open(INPUT, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if not row.get("agency_name", "").strip():
                continue
            score, reasons = score_prospect(row)
            prospects.append({
                "agency_name": row.get("agency_name", "").strip(),
                "domain": row.get("domain", "").strip(),
                "category": row.get("category", "").strip(),
                "contact_name": row.get("contact_name", "").strip(),
                "email": row.get("email", "").strip(),
                "position": row.get("position", "").strip(),
                "confidence": row.get("confidence", "").strip(),
                "is_decision_maker": row.get("is_decision_maker", "").strip(),
                "personalization_note": row.get("personalization_note", "").strip(),
                "icp_score": score,
                "icp_reasons": reasons,
            })
    
    # Sort by score descending
    prospects.sort(key=lambda x: x["icp_score"], reverse=True)
    
    # Deduplicate: one contact per agency (keep highest-scored)
    seen_agencies = set()
    deduped = []
    for p in prospects:
        key = p["domain"].lower()
        if key not in seen_agencies:
            seen_agencies.add(key)
            deduped.append(p)
    
    prospects = deduped
    print(f"After dedup (1 per agency): {len(prospects)}")
    
    # Top 30
    top30 = prospects[:30]
    
    # Print stats
    print(f"Total prospects scored: {len(prospects)}")
    print(f"Score range: {prospects[-1]['icp_score']} – {prospects[0]['icp_score']}")
    print(f"\nTop 30 cutoff score: {top30[-1]['icp_score']}")
    print(f"\nCategory breakdown in top 30:")
    cats = {}
    for p in top30:
        c = p["category"]
        cats[c] = cats.get(c, 0) + 1
    for c, n in sorted(cats.items(), key=lambda x: -x[1]):
        print(f"  {c}: {n}")
    
    # Generate markdown
    md_lines = [
        "# Pinger ICP-Ranked Prospect Shortlist",
        f"**Generated:** 2026-03-16 | **Source:** prospect-list-MASTER.csv (324 contacts)",
        f"**ICP:** Boutique web agencies doing WordPress maintenance, Webflow/Framer work",
        f"**Purpose:** Cold outreach via Instantly.ai — first sends ~Mar 21",
        "",
        "## Scoring Methodology",
        "- **Category fit** (0-30): wordpress-maintenance=30, wordpress-agency/webflow-agency=25, framer-agency=22, web-design=10",
        "- **Decision maker** (+15): YES = direct buyer",
        "- **Confidence** (0-10): data quality normalized",
        "- **Priority** (+5): HIGH from original list",
        "- **Keyword signals**: maintenance/retainer (+15), monitoring/uptime (+20), white-label (+10), WP/Webflow/Framer (+7-8), agency/client (+5)",
        "- **Title bonus** (+5): Founder/CEO/Owner/COO",
        "- **Negative signals**: enterprise (-10), devops (-8), mobile (-5)",
        "",
        "---",
        "",
        "## Top 30 Ranked Prospects",
        "",
    ]
    
    for i, p in enumerate(top30, 1):
        md_lines.append(f"### {i}. {p['agency_name']} — Score: {p['icp_score']}")
        md_lines.append(f"- **Domain:** {p['domain']}")
        md_lines.append(f"- **Category:** {p['category']}")
        md_lines.append(f"- **Contact:** {p['contact_name']} ({p['position']})")
        md_lines.append(f"- **Email:** {p['email']}")
        md_lines.append(f"- **Decision Maker:** {p['is_decision_maker']}")
        md_lines.append(f"- **Note:** {p['personalization_note']}")
        md_lines.append(f"- **Score Breakdown:** {', '.join(p['icp_reasons'])}")
        md_lines.append("")
    
    # Also add tier 2 (31-50) as honorable mentions
    md_lines.append("---")
    md_lines.append("")
    md_lines.append("## Tier 2: Next 20 (Backup Pool)")
    md_lines.append("")
    for i, p in enumerate(prospects[30:50], 31):
        md_lines.append(f"{i}. **{p['agency_name']}** ({p['category']}) — {p['contact_name']} ({p['position']}) — Score: {p['icp_score']}")
    
    md_lines.append("")
    md_lines.append("---")
    md_lines.append(f"*Full scored list: {len(prospects)} prospects. Bottom score: {prospects[-1]['icp_score']}*")
    
    md_content = "\n".join(md_lines)
    
    with open(OUTPUT_MD, "w") as f:
        f.write(md_content)
    print(f"\nMarkdown saved: {OUTPUT_MD}")
    
    # Save JSON for Airtable upload
    with open(OUTPUT_JSON, "w") as f:
        json.dump(top30, f, indent=2)
    print(f"JSON saved: {OUTPUT_JSON}")
    
    # Print top 10 summary
    print("\n=== TOP 10 PREVIEW ===")
    for i, p in enumerate(top30[:10], 1):
        print(f"{i}. [{p['icp_score']}] {p['agency_name']} ({p['category']}) — {p['contact_name']} ({p['position']})")

if __name__ == "__main__":
    main()
