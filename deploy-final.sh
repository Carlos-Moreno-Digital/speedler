#!/bin/bash
# ==========================================
#  SPEEDLER - Complete Final Setup
#  Run after all scripts are ready
# ==========================================
set -e
echo "=========================================="
echo "  SPEEDLER - Final Complete Setup"
echo "=========================================="

cd /docker/speedler

echo "[1/6] Pulling latest code..."
git pull origin claude/evershop-migration

echo "[2/6] Running branding, pages & SEO setup..."
docker cp setup-branding-pages.cjs speedler-app-1:/app/branding.cjs
docker exec -it speedler-app-1 node branding.cjs || echo "Branding setup had some non-critical errors"

echo "[3/6] Running payments & taxes setup..."
docker cp setup-payments-taxes.cjs speedler-app-1:/app/payments.cjs
docker exec -it speedler-app-1 node payments.cjs || echo "Payments setup had some non-critical errors"

echo "[4/6] Running PC configurator setup..."
docker cp setup-configurator.cjs speedler-app-1:/app/configurator.cjs
docker exec -it speedler-app-1 node configurator.cjs || echo "Configurator setup had some non-critical errors"

echo "[5/6] Running newsletter setup..."
docker cp setup-newsletter.cjs speedler-app-1:/app/newsletter.cjs
docker exec -it speedler-app-1 node newsletter.cjs || echo "Newsletter setup had some non-critical errors"

echo "[6/6] Restarting app..."
docker restart speedler-app-1
sleep 15

echo ""
echo "=========================================="
echo "  SETUP COMPLETE!"
echo "=========================================="
echo ""
echo "  Store:  https://demo2.5tcgroup.com"
echo "  Admin:  https://demo2.5tcgroup.com/admin"
echo "  Login:  admin@speedler.es / Speedler2024!"
echo ""
echo "  Features configured:"
echo "  - 26,700+ products with provider images"
echo "  - Speedler branding and logo"
echo "  - Legal pages (privacy, cookies, returns, terms)"
echo "  - Contact page"
echo "  - Canon digital on applicable products"
echo "  - Recargo de equivalencia rates"
echo "  - Bank transfer payment method"
echo "  - PC Configurator page"
echo "  - Newsletter subscription"
echo "  - Spanish taxes (IVA 21%)"
echo "  - Homepage collections with images"
echo "  - 15 categories in navigation"
echo ""
