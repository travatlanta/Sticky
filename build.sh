#!/bin/bash
npm run build
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
echo "Running database seed..."
npx tsx server/seed.ts || echo "Seed skipped (may already be seeded)"
