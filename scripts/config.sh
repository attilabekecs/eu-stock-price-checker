#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
source "${APP_CONFIG_FILE:-$ROOT/app.config}"
VERSION="$(node -p "JSON.parse(require('fs').readFileSync('$ROOT/version.json','utf8')).version")"
RUNTIME_DIR="${WD_VOLUME}/${APP_ID}"
UPDATER_DIR="${WD_VOLUME}/${APP_ID}-updater"
export ROOT VERSION RUNTIME_DIR UPDATER_DIR
