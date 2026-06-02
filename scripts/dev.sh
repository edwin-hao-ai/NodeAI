#!/usr/bin/env bash
# Local full stack: Cloud dev (:8788) + Tauri desktop (8787 embedded).
# Usage: ./scripts/dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

CLOUD_URL="${NODEAI_CLOUD_BASE_URL:-http://127.0.0.1:8788}"
CLOUD_HEALTH="${CLOUD_URL%/}/health"

cloud_up() {
  curl -sf "$CLOUD_HEALTH" >/dev/null 2>&1
}

start_cloud() {
  echo ">> Starting NodeAI Cloud dev ($CLOUD_URL)..."
  cargo run -p nodeai-cloud --bin nodeai-cloud-dev --release >>"$ROOT/.nodeai/cloud-dev.log" 2>&1 &
  echo $! >"$ROOT/.nodeai/cloud-dev.pid"
}

if ! cloud_up; then
  mkdir -p "$ROOT/.nodeai"
  start_cloud
  echo ">> Waiting for Cloud health..."
  for _ in $(seq 1 40); do
    if cloud_up; then
      echo ">> Cloud is up."
      break
    fi
    sleep 0.5
  done
  if ! cloud_up; then
    echo "ERROR: Cloud did not start. See $ROOT/.nodeai/cloud-dev.log"
    exit 1
  fi
else
  echo ">> Cloud already running ($CLOUD_URL)"
fi

if [[ ! -f "$HOME/.nodeai/.env" ]] || ! grep -qE '^AI_GATEWAY_API_KEY=.+' "$HOME/.nodeai/.env" 2>/dev/null; then
  echo ""
  echo "NOTE: 模型目录与 Chat 需要 Gateway Key。"
  echo "      创建 ~/.nodeai/.env 并设置 AI_GATEWAY_API_KEY=（Vercel AI Gateway）"
  echo ""
fi

echo ">> Launching desktop (Tauri dev)..."
cd "$ROOT/apps/desktop"
exec npm run tauri dev
