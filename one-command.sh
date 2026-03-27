#!/bin/bash
# ================================================
# SPEEDLER - COMPLETE DEPLOY
# Run: cd /docker/speedler && bash one-command.sh
# ================================================

echo "================================================"
echo "  SPEEDLER - COMPLETE DEPLOY"
echo "================================================"
echo ""

cd /docker/speedler

# 1. Pull latest code
echo "[1/6] Pulling latest code..."
git pull origin claude/evershop-migration 2>/dev/null || true
cp docker-compose.evershop.yml docker-compose.yml 2>/dev/null || true

# 2. Rebuild and start containers
echo "[2/6] Starting containers..."
docker compose down 2>/dev/null || true
sleep 3
docker compose build app 2>/dev/null
docker compose up -d
echo "   Waiting 35s for EverShop to initialize..."
sleep 35

# 3. Verify app is running internally
echo "[3/6] Verifying app..."
INTERNAL=$(docker exec speedler-app-1 wget -qO- http://localhost:3000/ 2>&1 | head -c 100)
if echo "$INTERNAL" | grep -q "DOCTYPE"; then
  echo "   App is running internally ✓"
else
  echo "   App not ready, waiting 20s more..."
  sleep 20
fi

# 4. Run the setup script
echo "[4/6] Running setup script..."
docker cp final-perfect-setup.cjs speedler-app-1:/app/setup.cjs 2>/dev/null
docker exec speedler-app-1 node /app/setup.cjs

# 5. Restart app to apply changes, then Traefik
echo "[5/6] Restarting services..."
docker restart speedler-app-1
sleep 20
docker restart n8n-traefik-1
sleep 15

# 6. Test
echo "[6/6] Testing..."
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://demo2.5tcgroup.com/)

if [ "$STATUS" = "200" ]; then
  echo ""
  echo "================================================"
  echo "  ✅ SPEEDLER IS LIVE!"
  echo "  Store: https://demo2.5tcgroup.com"
  echo "  Admin: https://demo2.5tcgroup.com/admin"
  echo "  Login: admin@speedler.es / Speedler2024!"
  echo "================================================"
else
  echo "   Status: $STATUS - Retrying Traefik..."
  docker restart n8n-traefik-1
  sleep 15
  STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://demo2.5tcgroup.com/)
  echo "   Final status: $STATUS"
  if [ "$STATUS" = "200" ]; then
    echo "   ✅ Store is live!"
  else
    echo "   ⚠️  Check: docker logs speedler-app-1 --tail 20"
  fi
fi
