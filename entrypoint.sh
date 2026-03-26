#!/bin/sh
echo "Running database migrations..."
node ./node_modules/prisma/build/index.js db push --skip-generate --accept-data-loss 2>&1 || echo "Warning: DB migration failed, app may not work correctly"
echo "Starting Speedler..."
exec node server.js
