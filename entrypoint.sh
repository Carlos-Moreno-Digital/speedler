#!/bin/sh
echo "Running database migrations..."
npx prisma db push --skip-generate 2>&1 || echo "Warning: DB migration failed, app may not work correctly"
echo "Starting Speedler..."
exec node server.js
