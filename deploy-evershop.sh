#!/bin/bash
# ============================================
# Speedler - EverShop Deploy on Hostinger VPS
# Domain: demo2.5tcgroup.com
# ============================================
set -e

echo "=== Speedler (EverShop) Deployment ==="

# Stop old speedler containers if running
echo "Stopping old Speedler containers..."
cd /docker/speedler
docker compose down 2>/dev/null || true

# Pull latest code
echo "Pulling latest code..."
git pull origin main 2>/dev/null || true

# Copy EverShop compose as main
cp docker-compose.evershop.yml docker-compose.yml

# Create directories
mkdir -p media extensions themes translations

# Copy logo
cp public/logo.png media/logo.png 2>/dev/null || true

# Start with EverShop
echo "Starting EverShop..."
docker compose pull app
docker compose up -d

echo "Waiting for EverShop to initialize (first boot takes ~60s)..."
sleep 60

# Check if running
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "=== Speedler (EverShop) is LIVE ==="
    echo "Store: https://demo2.5tcgroup.com"
    echo "Admin: https://demo2.5tcgroup.com/admin"
    echo ""
    echo "Default admin credentials (change after first login):"
    echo "  Create via: docker compose exec app npm run setup"
    echo ""
else
    echo "ERROR: EverShop failed to start. Check logs:"
    echo "  docker compose logs app --tail 50"
fi
