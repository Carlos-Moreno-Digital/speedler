#!/bin/bash
# SPEEDLER - ONE COMMAND DEPLOY
# Run: cd /docker/speedler && bash one-command.sh
set -e

echo "=== Speedler Deploy ==="

git pull origin claude/evershop-migration 2>/dev/null || true

# Fix widget areas in DB
docker exec -it speedler-db-1 psql -U postgres -d postgres -c "UPDATE widget SET area = '[\"content\"]'::jsonb WHERE jsonb_typeof(area) != 'array';" 2>/dev/null || true

# Restart everything in correct order
docker compose down 2>/dev/null || true
sleep 3
docker compose up -d
sleep 30

# Restart traefik AFTER app is fully up
docker restart n8n-traefik-1
sleep 10

# Test
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://demo2.5tcgroup.com/)
echo "Status: $STATUS"

if [ "$STATUS" = "200" ]; then
  echo "OK - Store is live at https://demo2.5tcgroup.com"
else
  echo "Retrying..."
  sleep 15
  docker restart n8n-traefik-1
  sleep 10
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://demo2.5tcgroup.com/)
  echo "Status: $STATUS"
fi
