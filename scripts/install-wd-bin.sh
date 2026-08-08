#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
TARGET="${1:-}"
BIN="${2:-}"
[[ -n "$TARGET" ]] || [[ ! -f "$ROOT/nas.target" ]] || TARGET="$(tr -d '[:space:]' < "$ROOT/nas.target")"
[[ -n "$TARGET" ]] || { echo "Hiányzó NAS cél." >&2; exit 1; }
[[ -n "$BIN" ]] || BIN="$ROOT/dist/${VERSION}_${APP_ID}_${WD_MODEL}.bin"
[[ -f "$BIN" ]] || { echo "Hiányzó APKG: $BIN. Futtasd: bash scripts/build-wd-bin.sh" >&2; exit 1; }
SSH_KEY="${NAS_SSH_KEY:-$HOME/.ssh/id_ed25519_nas}"
SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)
REMOTE_BIN="$WD_VOLUME/.systemfile/upload/$APP_ID.bin"
ssh "${SSH_OPTS[@]}" "$TARGET" "mkdir -p '$WD_VOLUME/.systemfile/upload'"
scp "${SSH_OPTS[@]}" "$BIN" "$TARGET:$REMOTE_BIN"
ssh "${SSH_OPTS[@]}" "$TARGET" /bin/sh -s -- "$REMOTE_BIN" "$APP_ID" <<'REMOTE'
set -eu
BIN="$1"; APP_ID="$2"
[ -x /usr/sbin/upload_apkg ] || { echo "upload_apkg nem található"; exit 1; }
cd "$(dirname "$BIN")"
if del_apkg whatever 2>/dev/null | grep -q "$APP_ID"; then upload_apkg -r"$(basename "$BIN")" -d -f1 -g1; fi
upload_apkg -m -p"$(basename "$BIN")" -t2
del_apkg whatever 2>/dev/null | grep -q "$APP_ID"
REMOTE
echo "$APP_DISPLAY_NAME telepítve a WD alkalmazások közé."
