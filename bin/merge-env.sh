#!/bin/bash

set -e  # Exit on any error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
OUTPUT="$(npm run env:merge:show merge | sed -ne '/# BEGIN ENV FILE/,$ p')"
rm -rf .env
echo "$OUTPUT" > .env