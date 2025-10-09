#!/bin/bash

# --- Definitive Deployment Script for CortexCart ---
echo "🚀 Starting foolproof deployment..."

# Exit immediately if a command exits with a non-zero status.
set -e

# 1. Fetch the latest code from GitHub.
echo "   - Syncing with GitHub..."
git fetch origin
git reset --hard origin/main

# 2. **NEW** - Remove old dependencies to ensure a clean slate.
echo "   - Clearing old node_modules and package-lock.json..."
rm -rf node_modules
rm -f package-lock.json

# 3. Install dependencies cleanly.
echo "   - Installing dependencies from scratch..."
npm install

# 4. Generate the Prisma Client.
echo "   - Generating Prisma database client..."
npx prisma generate

# 5. Clear any old cached build files.
echo "   - Clearing old application cache..."
rm -rf .next

# 6. Build the new, clean production application.
echo "   - Building the Next.js application..."
npm run build

# 7. Reload the application using PM2.
echo "   - Reloading the application with PM2..."
pm2 reload ecosystem.config.js --env production

echo "✅ Deployment finished successfully!"