#!/bin/bash
# Vantage scan + execute — runs every minute via system cron
# No LLM overhead — pure Node.js, fast
# Source only simple KEY=VALUE lines, skip multiline PEM blocks
export $(grep -E '^[A-Z_]+=.+' /root/PastaOS/.env | grep -v 'PRIVATE_KEY\|BEGIN\|END' | xargs) 2>/dev/null || true

LOG=/root/PastaOS/products/vantage/data/scan.log
MAX_LINES=500

cd /root/PastaOS/products/vantage

# Run scanner with execution
output=$(node src/index.js --l2 --exec 2>&1)
timestamp=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# Only log if signals found or errors (skip silent no-signal runs)
if echo "$output" | grep -qE "PLACED|ERR|error|signal"; then
  echo "[$timestamp] $output" >> "$LOG"
fi

# Always log summary line
summary=$(echo "$output" | grep -E "Signals found|Placed|rejected" | tr '\n' ' ')
if [ -n "$summary" ]; then
  echo "[$timestamp] $summary" >> "$LOG"
fi

# Trim log
if [ -f "$LOG" ]; then
  tail -$MAX_LINES "$LOG" > "${LOG}.tmp" && mv "${LOG}.tmp" "$LOG"
fi
