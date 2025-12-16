#!/bin/bash
echo "Building Next.js app..."
cd next-app && npm run build
echo "Syncing database schema..."
npx drizzle-kit push --force || echo "Schema sync skipped"
echo "Build complete!"
