#!/usr/bin/env bash
# Build nodeai-cloud-dev and stage as Tauri sidecar (Release/DMG can spawn without cargo).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

TARGET="$(rustc -vV | sed -n 's/^host: //p')"
BIN_DIR="$ROOT/apps/desktop/src-tauri/binaries"
SIDEcar="$BIN_DIR/nodeai-cloud-dev-$TARGET"

mkdir -p "$BIN_DIR"
cargo build -p nodeai-cloud --bin nodeai-cloud-dev --release

cp -f "${CARGO_TARGET_DIR:-$HOME/.cargo/shared-target}/release/nodeai-cloud-dev" "$SIDEcar"
chmod +x "$SIDEcar"
echo ">> Staged Cloud sidecar: $SIDEcar"
