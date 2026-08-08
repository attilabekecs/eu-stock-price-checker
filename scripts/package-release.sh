#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
OUTPUT="${1:-$ROOT/dist/${GITHUB_ASSET_PREFIX}-v${VERSION}.tar.gz}"
NODE_CACHE="$ROOT/dist/node-v${NODE_VERSION}-linux-x64.tar.gz"
NODE_URL="https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}-linux-x64.tar.gz"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
mkdir -p "$ROOT/dist" "$(dirname "$OUTPUT")"
if [[ ! -f "$NODE_CACHE" ]]; then curl -fsSL "$NODE_URL" -o "$NODE_CACHE"; fi
PKG="$TMP/$APP_ID"
mkdir -p "$PKG/node_bin" "$PKG/data"
cp -R "$ROOT/server" "$ROOT/public" "$PKG/"
cp "$ROOT/version.json" "$ROOT/app.config" "$PKG/"
tar -xzf "$NODE_CACHE" -C "$PKG/node_bin" --strip-components=2 "node-v${NODE_VERSION}-linux-x64/bin/node"
cat > "$PKG/start.sh" <<EOF
#!/bin/sh
APPDIR="$RUNTIME_DIR"
PIDFILE="\$APPDIR/$APP_ID.pid"
LOGFILE="\$APPDIR/$APP_ID.log"
NODE="\$APPDIR/node_bin/node"
[ -f "\$PIDFILE" ] && kill -0 "\$(cat "\$PIDFILE")" 2>/dev/null && exit 0
cd "\$APPDIR" || exit 1
PORT="$APP_PORT" APP_DISPLAY_NAME="$APP_DISPLAY_NAME" nohup "\$NODE" server/index.js >>"\$LOGFILE" 2>&1 &
echo \$! > "\$PIDFILE"
EOF
cat > "$PKG/stop.sh" <<EOF
#!/bin/sh
APPDIR="$RUNTIME_DIR"
PIDFILE="\$APPDIR/$APP_ID.pid"
[ -f "\$PIDFILE" ] && kill "\$(cat "\$PIDFILE")" 2>/dev/null || true
rm -f "\$PIDFILE"
EOF
chmod +x "$PKG/node_bin/node" "$PKG/start.sh" "$PKG/stop.sh"
tar -czf "$OUTPUT" -C "$TMP" "$APP_ID"
echo "$OUTPUT"
