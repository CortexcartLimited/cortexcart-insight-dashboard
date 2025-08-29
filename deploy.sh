#!/bin/bash

# --- Definitive Deployment Script for CortexCart ---
echo "🚀 Starting foolproof deployment..."

# Exit immediately if a command exits with a non-zero status.
set -e

# 1. Fetch the latest code and reset the local branch to match it exactly.
# This is safer than 'git pull' and avoids merge conflicts.
echo "   - Syncing with GitHub..."
git fetch origin
git reset --hard origin/main

# 2. Install dependencies
echo "   - Installing/updating dependencies..."
npm install

# 3. Generate the Prisma Client (This was a missing step)
echo "   - Generating Prisma database client..."
npx prisma generate

# 4. Clear any old cached build files
echo "   - Clearing old application cache..."
rm -rf .next

# 5. Build the new, clean production application
echo "   - Building the Next.js application..."
npm run build

# 6. Reload the application using PM2
# 'pm2 reload' is a zero-downtime restart that correctly loads the new code.
echo "   - Reloading the application with PM2..."
pm2 reload ecosystem.config.js --env production

echo "✅ Deployment finished successfully!"