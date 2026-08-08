#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
TARGET="${1:-}"
[[ -n "$TARGET" ]] || [[ ! -f "$ROOT/nas.target" ]] || TARGET="$(tr -d '[:space:]' < "$ROOT/nas.target")"
[[ -n "$TARGET" ]] || { echo "Hiányzó NAS cél." >&2; exit 1; }
SSH_KEY="${NAS_SSH_KEY:-$HOME/.ssh/id_ed25519_nas}"
SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)
REMOTE_SCRIPT="$UPDATER_DIR/nas-auto-update.sh"
ssh "${SSH_OPTS[@]}" "$TARGET" "mkdir -p '$UPDATER_DIR'"
scp "${SSH_OPTS[@]}" "$ROOT/scripts/nas-auto-update.sh" "$TARGET:$REMOTE_SCRIPT"
ssh "${SSH_OPTS[@]}" "$TARGET" /bin/sh -s -- "$REMOTE_SCRIPT" "$APP_ID" <<'REMOTE'
set -eu
SCRIPT="$1"; APP_ID="$2"
chmod +x "$SCRIPT"
LINE="* * * * * $SCRIPT >/dev/null 2>&1"
TMP="/tmp/${APP_ID}-cron.$$"
(crontab -l 2>/dev/null | grep -v "$SCRIPT" || true; echo "$LINE") > "$TMP"
crontab "$TMP"
rm -f "$TMP"
REMOTE
echo "Automatikus NAS-frissítés telepítve (percenkénti ellenőrzés)."
