#!/bin/bash
# ============================================
# Speedler - Deploy script for Hostinger VPS
# Domain: demo2.5tcgroup.com
# ============================================

set -e

echo "=== Speedler Deployment Script ==="
echo "Target: demo2.5tcgroup.com"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Installing Docker...${NC}"
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo -e "${GREEN}Docker installed successfully${NC}"
fi

# Step 2: Install Docker Compose if not present
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo -e "${YELLOW}Installing Docker Compose...${NC}"
    apt-get install -y docker-compose-plugin
    echo -e "${GREEN}Docker Compose installed successfully${NC}"
fi

# Step 3: Check .env file
if [ ! -f .env ]; then
    if [ -f .env.production ]; then
        echo -e "${YELLOW}Copying .env.production to .env${NC}"
        cp .env.production .env
        echo -e "${RED}IMPORTANT: Edit .env and set your real passwords before continuing!${NC}"
        echo "Run: nano .env"
        exit 1
    else
        echo -e "${RED}.env file not found. Create it from .env.production${NC}"
        exit 1
    fi
fi

# Step 4: Create SSL directory
mkdir -p nginx/ssl

# Step 5: First-time SSL setup (if no certs exist)
if [ ! -d "nginx/ssl/live/demo2.5tcgroup.com" ]; then
    echo -e "${YELLOW}Setting up SSL certificate with Let's Encrypt...${NC}"

    # Start nginx with temporary self-signed cert for ACME challenge
    mkdir -p nginx/ssl/live/demo2.5tcgroup.com

    # Generate temporary self-signed cert
    openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
        -keyout nginx/ssl/live/demo2.5tcgroup.com/privkey.pem \
        -out nginx/ssl/live/demo2.5tcgroup.com/fullchain.pem \
        -subj '/CN=demo2.5tcgroup.com'

    # Start nginx to handle ACME challenge
    docker compose -f docker-compose.prod.yml up -d nginx

    # Request real certificate
    docker compose -f docker-compose.prod.yml run --rm certbot \
        certonly --webroot \
        --webroot-path=/var/www/certbot \
        --email admin@5tcgroup.com \
        --agree-tos --no-eff-email \
        -d demo2.5tcgroup.com

    # Restart nginx with real cert
    docker compose -f docker-compose.prod.yml restart nginx

    echo -e "${GREEN}SSL certificate obtained successfully${NC}"
fi

# Step 6: Build and deploy
echo -e "${YELLOW}Building and deploying...${NC}"
docker compose -f docker-compose.prod.yml build --no-cache app
docker compose -f docker-compose.prod.yml up -d

# Step 7: Wait for database and run migrations
echo -e "${YELLOW}Waiting for database...${NC}"
sleep 10

echo -e "${YELLOW}Running database migrations...${NC}"
docker compose -f docker-compose.prod.yml exec app npx prisma db push

echo ""
echo -e "${GREEN}=== Deployment Complete ===${NC}"
echo -e "${GREEN}Site is live at: https://demo2.5tcgroup.com${NC}"
echo ""
echo "Useful commands:"
echo "  View logs:     docker compose -f docker-compose.prod.yml logs -f"
echo "  Restart:       docker compose -f docker-compose.prod.yml restart"
echo "  Stop:          docker compose -f docker-compose.prod.yml down"
echo "  DB seed:       docker compose -f docker-compose.prod.yml exec app npm run db:seed"
echo "  Rebuild:       docker compose -f docker-compose.prod.yml up -d --build app"
