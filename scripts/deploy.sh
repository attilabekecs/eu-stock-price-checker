#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
TARGET="${1:-}"
[[ -n "$TARGET" ]] || [[ ! -f "$ROOT/nas.target" ]] || TARGET="$(tr -d '[:space:]' < "$ROOT/nas.target")"
[[ -n "$TARGET" ]] || { echo "Hiányzó NAS cél. Hozd létre a nas.target fájlt (pl. sshd@192.168.100.6)." >&2; exit 1; }
SSH_KEY="${NAS_SSH_KEY:-$HOME/.ssh/id_ed25519_nas}"
SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)
PACKAGE="$ROOT/dist/${GITHUB_ASSET_PREFIX}-v${VERSION}.tar.gz"
bash "$SCRIPT_DIR/package-release.sh" "$PACKAGE"
REMOTE_PACKAGE="$WD_VOLUME/.${APP_ID}-${VERSION}.tar.gz"
scp "${SSH_OPTS[@]}" "$PACKAGE" "$TARGET:$REMOTE_PACKAGE"
ssh "${SSH_OPTS[@]}" "$TARGET" /bin/sh -s -- "$REMOTE_PACKAGE" "$RUNTIME_DIR" "$APP_ID" "$APP_PORT" "$HEALTH_PATH" <<'REMOTE'
set -eu
PACKAGE="$1"; RUNTIME="$2"; APP_ID="$3"; PORT="$4"; HEALTH="$5"
TMP="${RUNTIME}.new"
BACKUP="${RUNTIME}.bak"
[ -x "$RUNTIME/stop.sh" ] && "$RUNTIME/stop.sh" || true
rm -rf "$TMP"
mkdir -p "$TMP"
tar -xzf "$PACKAGE" -C "$TMP" --strip-components=1
if [ -d "$RUNTIME/data" ]; then rm -rf "$TMP/data"; cp -a "$RUNTIME/data" "$TMP/data"; fi
rm -rf "$BACKUP"
[ -d "$RUNTIME" ] && mv "$RUNTIME" "$BACKUP"
mv "$TMP" "$RUNTIME"
"$RUNTIME/start.sh"
sleep 2
if wget -qO- "http://127.0.0.1:${PORT}${HEALTH}" >/dev/null 2>&1; then
  rm -rf "$BACKUP" "$PACKAGE"
  echo "OK"
else
  "$RUNTIME/stop.sh" || true
  rm -rf "$RUNTIME"
  [ -d "$BACKUP" ] && mv "$BACKUP" "$RUNTIME"
  [ -x "$RUNTIME/start.sh" ] && "$RUNTIME/start.sh" || true
  echo "Health check sikertelen, rollback megtörtént." >&2
  exit 1
fi
REMOTE
echo "$APP_DISPLAY_NAME elérhető: http://${TARGET#*@}:$APP_PORT/"
