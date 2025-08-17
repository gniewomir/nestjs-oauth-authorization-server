#!/bin/bash

set -e  # Exit on any error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

if [[ "$1" == "--verbose" ]]; then
  LOG="verbose"
else
  LOG="silent"
fi

execute() {
  if [ $# -eq 0 ]; then
    echo "❌ Error: No command to execute."
    return 1
  fi

  echo "▶️  Executing: '$*'..."

  if [[ "$LOG" == "verbose" ]]; then
    "$@"
  else
    "$@" > /dev/null 2>&1
  fi

  local exit_code=$?

  if [ $exit_code -eq 0 ]; then
    echo "✅ '$*' success!"
  else
    echo "❌ Error, returned exit code: $exit_code"
  fi

  return $exit_code
}

execute cd "$PROJECT_ROOT"
execute find src/infrastructure/database/migrations -name "*.ts" -delete
execute ./bin/reset-test-db.sh
execute npm run migration:generate --name=initial
execute npm run format
execute npm run lint
execute npm run migration:run
execute git add src/infrastructure/database/migrations