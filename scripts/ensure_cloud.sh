#!/usr/bin/env bash
# Ensure nodeai-cloud-dev is listening on :8788 (idempotent).
# Usage: ./scripts/ensure_cloud.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
CLOUD_URL="${NODEAI_CLOUD_BASE_URL:-http://127.0.0.1:8788}"
CLOUD_HEALTH="${CLOUD_URL%/}/health"
LOG="$ROOT/.nodeai/cloud-dev.log"
PIDFILE="$ROOT/.nodeai/cloud-dev.pid"

cloud_up() {
  curl -sf "$CLOUD_HEALTH" >/dev/null 2>&1
}

if cloud_up; then
  echo ">> Cloud already running ($CLOUD_URL)"
  exit 0
fi

mkdir -p "$ROOT/.nodeai"

# Reuse running pid if still alive
if [[ -f "$PIDFILE" ]]; then
  old_pid="$(cat "$PIDFILE" 2>/dev/null || true)"
  if [[ -n "${old_pid:-}" ]] && kill -0 "$old_pid" 2>/dev/null; then
    echo ">> Cloud dev process $old_pid still starting..."
  fi
fi

TARGET="${CARGO_TARGET_DIR:-$HOME/.cargo/shared-target}"
BIN="$TARGET/release/nodeai-cloud-dev"

echo ">> Starting nodeai-cloud-dev ($CLOUD_URL)..."
if [[ -x "$BIN" ]]; then
  "$BIN" >>"$LOG" 2>&1 &
else
  (cd "$ROOT" && cargo run -p nodeai-cloud --bin nodeai-cloud-dev --release) >>"$LOG" 2>&1 &
fi
echo $! >"$PIDFILE"

echo ">> Waiting for Cloud health (first compile may take ~60s)..."
for _ in $(seq 1 90); do
  if cloud_up; then
    echo ">> Cloud is up ($CLOUD_URL)"
    exit 0
  fi
  sleep 1
done

echo "ERROR: Cloud did not start within 90s. See $LOG"
tail -20 "$LOG" 2>/dev/null || true
exit 1
