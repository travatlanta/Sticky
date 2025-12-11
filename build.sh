#!/bin/bash
npm run build
esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outdir=dist
