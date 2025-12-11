#!/bin/bash
echo "Building frontend..."
vite build
echo "Building backend..."
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "Syncing database schema..."
npx drizzle-kit push --force || echo "Schema sync skipped"
echo "Seeding database..."
npx tsx server/seed.ts || echo "Seed skipped (may already be seeded)"
echo "Build complete!"
