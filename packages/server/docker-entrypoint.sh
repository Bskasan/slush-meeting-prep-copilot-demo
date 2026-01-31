#!/bin/sh
set -e
cd /app/packages/server && npx prisma migrate deploy
exec "$@"
