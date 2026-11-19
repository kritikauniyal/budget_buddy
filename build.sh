#!/usr/bin/env bash
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "==> Installing frontend dependencies & building production bundle..."
npm --prefix frontend install
npm --prefix frontend run build

echo "==> Installing Python backend dependencies..."
pip install -r backend/requirements.txt

echo "==> Build complete! Both frontend and backend are ready."

