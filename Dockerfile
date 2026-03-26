FROM node:20-alpine AS base

RUN apk add --no-cache libc6-compat openssl python3 make g++

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install --legacy-peer-deps 2>&1 || (cat /root/.npm/_logs/*.log && exit 1)

COPY . .

RUN npx prisma generate

FROM base AS build
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

FROM node:20-alpine AS production
WORKDIR /app

COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static
COPY --from=build /app/public ./public
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=build /app/node_modules/@prisma ./node_modules/@prisma

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
