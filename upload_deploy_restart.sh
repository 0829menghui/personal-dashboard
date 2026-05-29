#!/usr/bin/env bash
set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
COMMIT_MESSAGE="${1:-chore: deploy personal dashboard}"

cd "$PROJECT_ROOT"
bash publish.sh "$COMMIT_MESSAGE"
