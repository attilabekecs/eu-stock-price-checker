#!/usr/bin/env bash
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/config.sh"
TARGET="${1:-}"
[[ -n "$TARGET" ]] || [[ ! -f "$ROOT/nas.target" ]] || TARGET="$(tr -d '[:space:]' < "$ROOT/nas.target")"
[[ -n "$TARGET" ]] || { echo "A WD-kompatibilis aláíráshoz add meg a NAS célt." >&2; exit 1; }
SSH_KEY="${NAS_SSH_KEY:-$HOME/.ssh/id_ed25519_nas}"
SSH_OPTS=(-i "$SSH_KEY" -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=accept-new)
STAGING="$ROOT/dist/wd-staging/$APP_ID"
PACKAGE="$ROOT/dist/${GITHUB_ASSET_PREFIX}-v${VERSION}.tar.gz"
MKSAPKG="$ROOT/dist/mksapkg-OS5"
REMOTE_BUILD="$WD_VOLUME/.${APP_ID}-wd-build"
REMOTE_TOOL="$WD_VOLUME/.mksapkg-OS5"
OUTPUT="$ROOT/dist/${VERSION}_${APP_ID}_${WD_MODEL}.bin"

bash "$SCRIPT_DIR/package-release.sh" "$PACKAGE"
rm -rf "$STAGING"
mkdir -p "$STAGING/payload"
tar -xzf "$PACKAGE" -C "$STAGING/payload" --strip-components=1

cat > "$STAGING/apkg.rc" <<EOF
Package:            $APP_ID
Section:            Addon
Version:            $VERSION
Packager:           $APP_PACKAGER
Email:              $APP_EMAIL
Homepage:           $APP_HOMEPAGE
Description:        $APP_DESCRIPTION
AddonShowName:      $APP_DISPLAY_NAME
Icon:               $APP_ID.png
AddonIndexPage:     index.php
AddonUsedPort:
InstDepend:
InstConflict:
StartDepend:
StartConflict:
CenterType:         0
UserControl:
MinFWVer:
MaxFWVer:
IndividualFlag:     1
EOF

cat > "$STAGING/before_apkg.sh" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$STAGING/preinst.sh" <<EOF
#!/bin/sh
set -eu
BACKUP="/var/tmp/$APP_ID-preinst"
DATA="$RUNTIME_DIR/data"
rm -rf "\$BACKUP"; mkdir -p "\$BACKUP"
[ -d "\$DATA" ] && cp -a "\$DATA" "\$BACKUP/data" 2>/dev/null || true
exit 0
EOF
cat > "$STAGING/install.sh" <<'EOF'
#!/bin/sh
set -eu
path_src="$1"; path_des="$2"
mv -f "$path_src" "$path_des"
EOF
cat > "$STAGING/init.sh" <<EOF
#!/bin/sh
set -eu
path="\$1"
RUNTIME="$RUNTIME_DIR"
BACKUP="/var/tmp/$APP_ID-preinst"
WEB_LINK="/var/www/$APP_ID"
DATA_BACKUP="/var/tmp/$APP_ID-data.tar"
[ -f "\$RUNTIME/stop.sh" ] && sh "\$RUNTIME/stop.sh" 2>/dev/null || true
rm -f "\$DATA_BACKUP"
[ -d "\$RUNTIME/data" ] && tar -cf "\$DATA_BACKUP" -C "\$RUNTIME/data" . 2>/dev/null || true
mkdir -p "\$RUNTIME"
cp -a "\$path/payload/." "\$RUNTIME/"
rm -rf "\$RUNTIME/data" && mkdir -p "\$RUNTIME/data"
[ -f "\$DATA_BACKUP" ] && tar -xf "\$DATA_BACKUP" -C "\$RUNTIME/data" 2>/dev/null || true
[ -d "\$BACKUP/data" ] && cp -a "\$BACKUP/data/." "\$RUNTIME/data/" 2>/dev/null || true
chmod +x "\$RUNTIME/node_bin/node" "\$RUNTIME/start.sh" "\$RUNTIME/stop.sh"
rm -rf "\$BACKUP" "\$DATA_BACKUP"
ln -sfn "\$path" "\$WEB_LINK"
EOF
cat > "$STAGING/start.sh" <<EOF
#!/bin/sh
exec /bin/sh "$RUNTIME_DIR/start.sh"
EOF
cat > "$STAGING/stop.sh" <<EOF
#!/bin/sh
[ -f "$RUNTIME_DIR/stop.sh" ] && /bin/sh "$RUNTIME_DIR/stop.sh" || true
EOF
cat > "$STAGING/remove.sh" <<EOF
#!/bin/sh
[ -f "$RUNTIME_DIR/stop.sh" ] && /bin/sh "$RUNTIME_DIR/stop.sh" || true
rm -f "/var/www/$APP_ID"
rm -rf "$RUNTIME_DIR"
EOF
cat > "$STAGING/clean.sh" <<'EOF'
#!/bin/sh
exit 0
EOF
cat > "$STAGING/index.php" <<EOF
<?php
header('Location: http://' . \$_SERVER['SERVER_ADDR'] . ':$APP_PORT/');
exit;
?>
EOF
mkdir -p "$STAGING/web"; cp "$STAGING/index.php" "$STAGING/web/index.php"
chmod +x "$STAGING"/*.sh
python3 - "$STAGING/$APP_ID.png" <<'PY'
import struct,sys,zlib
from pathlib import Path
p=Path(sys.argv[1]); s=128
def c(k,d): return struct.pack('>I',len(d))+k+d+struct.pack('>I',zlib.crc32(k+d)&0xffffffff)
rows=[]
for y in range(s):
    row=bytearray()
    for x in range(s):
        dx=x-s/2; dy=y-s/2; g=max(0.0,1.0-(dx*dx+dy*dy)**0.5/90)
        row.extend((int(8+12*g),int(22+72*g),int(20+62*g),255))
    rows.append(b'\x00'+bytes(row))
h=struct.pack('>IIBBBBB',s,s,8,6,0,0,0)
p.write_bytes(b'\x89PNG\r\n\x1a\n'+c(b'IHDR',h)+c(b'IDAT',zlib.compress(b''.join(rows),9))+c(b'IEND',b''))
PY

if [[ ! -f "$MKSAPKG" ]]; then curl -fsSL "https://raw.githubusercontent.com/WDCommunity/wdpksrc/master/mksapkg-OS5" -o "$MKSAPKG"; chmod +x "$MKSAPKG"; fi
ssh "${SSH_OPTS[@]}" "$TARGET" "rm -rf '$REMOTE_BUILD'; mkdir -p '$REMOTE_BUILD'"
scp "${SSH_OPTS[@]}" "$MKSAPKG" "$TARGET:$REMOTE_TOOL"
scp "${SSH_OPTS[@]}" -r "$STAGING" "$TARGET:$REMOTE_BUILD/"
ssh "${SSH_OPTS[@]}" "$TARGET" /bin/sh -s -- "$REMOTE_TOOL" "$REMOTE_BUILD/$APP_ID" "$WD_MODEL" <<'REMOTE'
set -eu
TOOL="$1"; STAGING="$2"; MODEL="$3"
chmod +x "$TOOL"; cd "$STAGING"; "$TOOL" -E -s -m "$MODEL"
REMOTE
REMOTE_BIN="$(ssh "${SSH_OPTS[@]}" "$TARGET" "ls -1 '$REMOTE_BUILD'/*_${APP_ID}_*.bin 2>/dev/null | head -n 1")"
[[ -n "$REMOTE_BIN" ]] || { echo "A NAS nem készített .bin csomagot." >&2; exit 1; }
scp "${SSH_OPTS[@]}" "$TARGET:$REMOTE_BIN" "$OUTPUT"
echo "WD APKG kész: $OUTPUT"
