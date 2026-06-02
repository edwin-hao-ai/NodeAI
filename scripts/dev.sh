#!/usr/bin/env bash
# Local full stack: Cloud dev (:8788) + Tauri desktop (8787 embedded).
# Usage: ./scripts/dev.sh
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

"$ROOT/scripts/ensure_cloud.sh"

if [[ ! -f "$HOME/.nodeai/.env" ]] || ! grep -qE '^AI_GATEWAY_API_KEY=.+' "$HOME/.nodeai/.env" 2>/dev/null; then
  echo ""
  echo "NOTE: 模型目录与 Chat 需要 Gateway Key。"
  echo "      创建 ~/.nodeai/.env 并设置 AI_GATEWAY_API_KEY=（Vercel AI Gateway）"
  echo ""
fi

echo ">> Launching desktop (Tauri dev)..."
cd "$ROOT/apps/desktop"
exec npm run tauri dev
