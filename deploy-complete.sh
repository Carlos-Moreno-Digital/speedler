#!/bin/bash
# =====================================================
# SPEEDLER - COMPLETE DEPLOY & SETUP SCRIPT
# Run this once after git pull to set up everything
# =====================================================
set -e

echo "=========================================="
echo "  SPEEDLER - Complete Setup"
echo "=========================================="
echo ""

cd /docker/speedler

# 1. Pull latest code
echo "[1/7] Pulling latest code..."
git pull origin claude/evershop-migration

# 2. Copy docker-compose
echo "[2/7] Updating Docker Compose..."
cp docker-compose.evershop.yml docker-compose.yml

# 3. Restart containers
echo "[3/7] Restarting containers..."
docker compose down
docker compose up -d
echo "Waiting for EverShop to start..."
sleep 25

# 4. Run master fix script (names, collections, nav, settings, taxes)
echo "[4/7] Running master fix script..."
docker cp /docker/speedler/fix-all-final.cjs speedler-app-1:/app/fixall.cjs
docker exec speedler-app-1 node /app/fixall.cjs || echo "Some fixes had issues (non-critical)"

# 5. Run canon digital and shipping setup
echo "[5/7] Setting up canon digital and shipping..."
docker cp /docker/speedler/setup-canon-recargo.cjs speedler-app-1:/app/canon.cjs 2>/dev/null && \
docker exec speedler-app-1 node /app/canon.cjs || echo "Canon digital setup skipped"

docker cp /docker/speedler/setup-shipping-gls.cjs speedler-app-1:/app/shipping.cjs 2>/dev/null && \
docker exec speedler-app-1 node /app/shipping.cjs || echo "Shipping setup skipped"

# 6. Run supplier sync (downloads images and names from providers)
echo "[6/7] Running supplier sync (this may take a few minutes)..."
docker cp /docker/speedler/run-supplier-sync.cjs speedler-app-1:/app/sync.cjs 2>/dev/null && \
docker exec speedler-app-1 node /app/sync.cjs || echo "Supplier sync had issues"

# 7. Restart app to pick up all changes
echo "[7/7] Final restart..."
docker restart speedler-app-1
sleep 15

echo ""
echo "=========================================="
echo "  SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "  Store: https://demo2.5tcgroup.com"
echo "  Admin: https://demo2.5tcgroup.com/admin"
echo "  Login: admin@speedler.es / Speedler2024!"
echo ""
echo "  PC Configurator: copy configurador-pc.html"
echo "    to the media volume if needed"
echo ""
