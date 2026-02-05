#!/bin/bash

# Script to run build:all for both backend and frontend
# Usage: ./build-all.sh [--build|-b]
#   --build or -b: Run 'build' instead of 'build:all'

set -e  # Exit on error

# Check if --build or -b flag is passed
BUILD_CMD="build:all"
if [[ "$1" == "--build" ]] || [[ "$1" == "-b" ]]; then
  BUILD_CMD="build"
  echo "🚀 Building projects (standard build)..."
else
  echo "🚀 Building all projects..."
fi
echo ""

# Get the project root directory (parent of .helper)
PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

echo "📦 Building backend..."
cd "$PROJECT_ROOT/backend-api"
bun run "$BUILD_CMD"

echo ""
echo "📦 Building frontend..."
cd "$PROJECT_ROOT/frontend"
bun run "$BUILD_CMD"

echo ""
echo "✅ All builds completed successfully!"
