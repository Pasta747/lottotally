#!/usr/bin/env python3
"""
Upload ICP-ranked Pinger prospects to Airtable.
Maps ICP scores to 1-5 star rating and batch-creates records.
"""

import json
import urllib.request
import urllib.error
import time
import math

TOKEN = "patHDuUaKJYRMLSqH.f8b8264a90004871ff90cf9f169b96ee0a81d4c0f074a5b86318ccd8cce1fafc"
BASE_ID = "appJH8kqKSpqVSQmI"
TABLE_ID = "tblK7vttCt1usJeMy"
INPUT = "/root/PastaOS/CRO_Marcus/research/icp-ranked-prospects.json"

def score_to_stars(score, max_score=118):
    """Map numeric ICP score to 1-5 star rating."""
    ratio = score / max_score
    if ratio >= 0.8:
        return 5
    elif ratio >= 0.6:
        return 4
    elif ratio >= 0.45:
        return 3
    elif ratio >= 0.3:
        return 2
    return 1

def create_records(records):
    """Batch create up to 10 records."""
    url = f"https://api.airtable.com/v0/{BASE_ID}/{TABLE_ID}"
    headers = {
        "Authorization": f"Bearer {TOKEN}",
        "Content-Type": "application/json",
    }
    body = json.dumps({"records": records}).encode()
    req = urllib.request.Request(url, data=body, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req) as r:
            result = json.loads(r.read())
            return len(result.get("records", []))
    except urllib.error.HTTPError as e:
        error = e.read().decode()
        print(f"  ERROR: {e.code} — {error}")
        return 0

def main():
    with open(INPUT) as f:
        prospects = json.load(f)

    max_score = max(p["icp_score"] for p in prospects)
    print(f"Loading {len(prospects)} prospects (max score: {max_score})")

    # Map to Airtable fields
    airtable_records = []
    for p in prospects:
        stars = score_to_stars(p["icp_score"], max_score)
        note_parts = [
            f"ICP Score: {p['icp_score']}/{max_score}",
            f"Category: {p['category']}",
            f"Decision Maker: {p['is_decision_maker']}",
            f"Personalization: {p['personalization_note']}",
        ]
        airtable_records.append({
            "fields": {
                "Company Name": p["agency_name"],
                "Contact Name": p["contact_name"],
                "Email": p["email"],
                "Title": p["position"],
                "Website": f"https://{p['domain']}" if not p["domain"].startswith("http") else p["domain"],
                "Source": "Hunter",
                "Status": "New",
                "Assigned To": "Marcus",
                "ICP Score": stars,
                "Notes": "\n".join(note_parts),
            }
        })

    # Batch upload in groups of 10 (Airtable limit)
    total_created = 0
    for i in range(0, len(airtable_records), 10):
        batch = airtable_records[i:i+10]
        print(f"  Uploading batch {i//10 + 1} ({len(batch)} records)...")
        created = create_records(batch)
        total_created += created
        if i + 10 < len(airtable_records):
            time.sleep(0.25)  # Rate limit courtesy

    print(f"\n✅ Uploaded {total_created}/{len(prospects)} prospects to Airtable")
    print(f"🔗 https://airtable.com/{BASE_ID}/{TABLE_ID}")

if __name__ == "__main__":
    main()
