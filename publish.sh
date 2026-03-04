#!/usr/bin/env bash
set -euo pipefail

if ! git rev-parse --is-inside-work-tree >/dev/null 2>&1; then
  echo "Run this inside a git repo."
  exit 1
fi

if ! git remote get-url origin >/dev/null 2>&1; then
  echo "No git remote named 'origin' is set yet."
  echo "Set it first, for example:"
  echo "  git remote add origin git@github.com:<your-user>/waiv-site.git"
  exit 1
fi

message=${1:-"Update website"}

git add .
if git diff --cached --quiet; then
  echo "No changes to publish."
  exit 0
fi

git commit -m "$message"
git push origin main

echo "Published. Cloudflare Pages will deploy automatically."
