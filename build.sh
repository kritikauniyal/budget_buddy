#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Preparing production build for Render..."

# If node and npm exist, build fresh frontend bundle
if command -v npm &> /dev/null; then
  echo "==> Building fresh frontend bundle with npm..."
  npm --prefix frontend install
  npm --prefix frontend run build
else
  echo "==> npm command not found; using committed frontend dist assets."
fi

# Ensure static dist folder exists in backend for reliable serving
mkdir -p backend/app/static/dist
if [ -d "frontend/dist" ]; then
  echo "==> Syncing frontend dist to backend static..."
  cp -r frontend/dist/* backend/app/static/dist/
fi

echo "==> Installing Python backend dependencies..."
pip install --upgrade pip
pip install -r backend/requirements.txt

echo "==> Build complete! Frontend and backend are ready."

