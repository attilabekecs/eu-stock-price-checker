#!/bin/sh
set -eu
APP_ID="eu-stock-price-checker"
APP_PORT="8790"
HEALTH_PATH="/api/health"
RUNTIME_DIR="/shares/Volume_1/eu-stock-price-checker"
WORK_DIR="/shares/Volume_1/eu-stock-price-checker-updater"
REPO="attilabekecs/eu-stock-price-checker"
ASSET_PREFIX="eu-stock-price-checker"
mkdir -p "$WORK_DIR"
LOCK="$WORK_DIR/update.lock"
[ -e "$LOCK" ] && exit 0
trap 'rm -f "$LOCK"' EXIT
touch "$LOCK"

LATEST_JSON="$(wget -qO- "https://api.github.com/repos/$REPO/releases/latest" 2>/dev/null || true)"
[ -n "$LATEST_JSON" ] || exit 0
TAG="$(printf '%s' "$LATEST_JSON" | sed -n 's/.*"tag_name"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' | head -n1)"
[ -n "$TAG" ] || exit 0
VERSION="${TAG#v}"
CURRENT="$(sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$RUNTIME_DIR/version.json" 2>/dev/null | head -n1 || true)"
[ "$CURRENT" = "$VERSION" ] && exit 0
ASSET_URL="https://github.com/$REPO/releases/download/$TAG/$ASSET_PREFIX-$TAG.tar.gz"
PKG="$WORK_DIR/$ASSET_PREFIX-$TAG.tar.gz"
wget -qO "$PKG" "$ASSET_URL" || { rm -f "$PKG"; exit 1; }
TMP="$RUNTIME_DIR.new"
BACKUP="$RUNTIME_DIR.bak"
[ -x "$RUNTIME_DIR/stop.sh" ] && "$RUNTIME_DIR/stop.sh" || true
rm -rf "$TMP"
mkdir -p "$TMP"
tar -xzf "$PKG" -C "$TMP" --strip-components=1
if [ -d "$RUNTIME_DIR/data" ]; then rm -rf "$TMP/data"; cp -a "$RUNTIME_DIR/data" "$TMP/data"; fi
rm -rf "$BACKUP"
[ -d "$RUNTIME_DIR" ] && mv "$RUNTIME_DIR" "$BACKUP"
mv "$TMP" "$RUNTIME_DIR"
"$RUNTIME_DIR/start.sh"
sleep 2
if wget -qO- "http://127.0.0.1:${APP_PORT}${HEALTH_PATH}" >/dev/null 2>&1; then
  rm -rf "$BACKUP" "$PKG"
  logger -t "$APP_ID" "Frissítve: $CURRENT -> $VERSION"
else
  "$RUNTIME_DIR/stop.sh" || true
  rm -rf "$RUNTIME_DIR"
  [ -d "$BACKUP" ] && mv "$BACKUP" "$RUNTIME_DIR"
  [ -x "$RUNTIME_DIR/start.sh" ] && "$RUNTIME_DIR/start.sh" || true
  logger -t "$APP_ID" "Frissítés sikertelen, rollback: $VERSION"
  exit 1
fi
