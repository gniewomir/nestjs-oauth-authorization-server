#!/bin/bash

set -e  # Exit on any error

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
