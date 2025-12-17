#!/bin/bash

# Script to run build:all for both backend and frontend
# Usage: ./build-all.sh

set -e  # Exit on error

echo "🚀 Building all projects..."
echo ""

# Get the project root directory (parent of .helper)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "📦 Building backend..."
cd "$PROJECT_ROOT/backend-api"
pnpm run build:all

echo ""
echo "📦 Building frontend..."
cd "$PROJECT_ROOT/frontend"
pnpm run build:all

echo ""
echo "✅ All builds completed successfully!"

