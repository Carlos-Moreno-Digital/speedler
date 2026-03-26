#!/usr/bin/env bash
# Speedler Supplier Sync Cron Script
# Add to crontab with: crontab -e
# */15 * * * * /path/to/speedler/cron-sync.sh >> /var/log/speedler-sync.log 2>&1

set -euo pipefail

SYNC_URL="${SYNC_URL:-http://localhost:3000/api/cron/supplier-sync}"
CRON_SECRET="${CRON_SECRET:-}"

echo "[$(date -Iseconds)] Starting supplier sync..."

HTTP_CODE=$(curl -s -o /tmp/speedler-sync-response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: Bearer ${CRON_SECRET}" \
  -H "Content-Type: application/json" \
  "${SYNC_URL}")

if [ "$HTTP_CODE" -eq 200 ]; then
  echo "[$(date -Iseconds)] Sync completed successfully (HTTP ${HTTP_CODE})"
  cat /tmp/speedler-sync-response.json
  echo ""
else
  echo "[$(date -Iseconds)] Sync failed with HTTP ${HTTP_CODE}"
  cat /tmp/speedler-sync-response.json
  echo ""
  exit 1
fi
