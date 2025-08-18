#!/bin/bash

set -e  # Exit on any error

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

. "$(dirname "$0")/include/execute.sh"

execute cd "$PROJECT_ROOT"
execute find src/infrastructure/database/migrations -name "*.ts" -delete
execute ./bin/reset-test-db.sh "--$LOG"
execute npm run build
execute npm run migration:generate --name=bootstrap
execute npm run format
execute npm run lint
execute npm run migration:run
execute git add src/infrastructure/database/migrations