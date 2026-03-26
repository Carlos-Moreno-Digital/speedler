#!/bin/bash
# ============================================
# Speedler - Deploy on Ubuntu VPS (Hostinger)
# Domain: demo2.5tcgroup.com
# ============================================

set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}=== Speedler - Ubuntu VPS Deploy ===${NC}"
echo ""

# Step 1: System updates & dependencies
echo -e "${YELLOW}[1/7] Installing system dependencies...${NC}"
apt-get update
apt-get install -y curl git nginx postgresql postgresql-contrib certbot python3-certbot-nginx

# Install Node.js 20
if ! command -v node &> /dev/null || [[ $(node -v | cut -d. -f1 | tr -d v) -lt 20 ]]; then
    echo -e "${YELLOW}Installing Node.js 20...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

# Install PM2
if ! command -v pm2 &> /dev/null; then
    npm install -g pm2
fi

echo -e "${GREEN}Node $(node -v) | npm $(npm -v) | PM2 installed${NC}"

# Step 2: Setup PostgreSQL
echo -e "${YELLOW}[2/7] Setting up PostgreSQL...${NC}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname='speedler'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER speedler WITH PASSWORD 'SpeedlerDB_2024!';"

sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname='speedler_db'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE speedler_db OWNER speedler;"

echo -e "${GREEN}PostgreSQL ready${NC}"

# Step 3: Clone/update repo
echo -e "${YELLOW}[3/7] Getting source code...${NC}"
APP_DIR="/var/www/speedler"

if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git fetch origin
    git checkout claude/deploy-hostinger-mcp-wCI1X
    git pull origin claude/deploy-hostinger-mcp-wCI1X
else
    git clone -b claude/deploy-hostinger-mcp-wCI1X https://github.com/Carlos-Moreno-Digital/speedler.git "$APP_DIR"
    cd "$APP_DIR"
fi

# Step 4: Create .env
echo -e "${YELLOW}[4/7] Configuring environment...${NC}"
if [ ! -f .env ]; then
    NEXTAUTH_SECRET=$(openssl rand -base64 32)
    CRON_SECRET=$(openssl rand -base64 32)
    cat > .env << ENVEOF
DATABASE_URL="postgresql://speedler:SpeedlerDB_2024!@localhost:5432/speedler_db?schema=public"

NEXTAUTH_URL="https://demo2.5tcgroup.com"
NEXTAUTH_SECRET="${NEXTAUTH_SECRET}"

NEXT_PUBLIC_SITE_URL="https://demo2.5tcgroup.com"
NEXT_PUBLIC_SITE_NAME="Speedler"

REDSYS_MERCHANT_CODE=
REDSYS_TERMINAL=
REDSYS_SECRET_KEY=
REDSYS_URL=https://sis-t.redsys.es:25443/sis/realizarPago

SEQURA_MERCHANT_REF=
SEQURA_API_KEY=
SEQURA_URL=https://sandbox.sequrapi.com

GLS_API_URL=
GLS_API_KEY=
GLS_CLIENT_CODE=

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=noreply@speedler.es

MAILCHIMP_API_KEY=
MAILCHIMP_LIST_ID=

CRON_SECRET="${CRON_SECRET}"
ENVEOF
    echo -e "${GREEN}.env created with auto-generated secrets${NC}"
else
    echo -e "${GREEN}.env already exists, keeping current config${NC}"
fi

# Step 5: Install deps & build
echo -e "${YELLOW}[5/7] Installing dependencies and building...${NC}"
npm install
npx prisma generate
npx prisma db push
npm run build

# Step 6: Setup PM2
echo -e "${YELLOW}[6/7] Starting app with PM2...${NC}"
pm2 delete speedler 2>/dev/null || true
pm2 start npm --name "speedler" -- start
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null || true

# Step 7: Configure Nginx
echo -e "${YELLOW}[7/7] Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/speedler << 'NGINXEOF'
server {
    listen 80;
    server_name demo2.5tcgroup.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/speedler /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl restart nginx

# SSL with Let's Encrypt
echo -e "${YELLOW}Setting up SSL...${NC}"
certbot --nginx -d demo2.5tcgroup.com --non-interactive --agree-tos --email admin@5tcgroup.com || \
    echo -e "${RED}SSL setup failed - you can retry with: certbot --nginx -d demo2.5tcgroup.com${NC}"

echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}  Speedler deployed successfully!${NC}"
echo -e "${GREEN}  https://demo2.5tcgroup.com${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo "Useful commands:"
echo "  pm2 logs speedler      - View logs"
echo "  pm2 restart speedler   - Restart app"
echo "  pm2 monit              - Monitor resources"
echo "  cd /var/www/speedler   - Project directory"
