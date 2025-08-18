#!/bin/bash

set -e  # Exit on any error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$(npm run env:default:show default | sed -ne '/# BEGIN ENV FILE/,$ p')"
rm -rf .env.dist
echo "$OUTPUT" > .env.dist