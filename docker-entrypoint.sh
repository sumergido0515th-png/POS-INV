#!/bin/sh
set -e

# Apply schema to the configured Postgres database (safe to re-run on restarts).
npx prisma db push --skip-generate

# Seed only if the database has no users yet (idempotent, safe on restarts).
USER_COUNT=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count().then((c) => { console.log(c); process.exit(0); }).catch(() => { console.log(0); process.exit(0); });
")

if [ "$USER_COUNT" = "0" ]; then
  echo "No users found — seeding demo data..."
  npx tsx prisma/seed.ts
fi

exec "$@"
