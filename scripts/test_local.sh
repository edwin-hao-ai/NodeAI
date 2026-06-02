#!/usr/bin/env bash
# Run all local tests (no GitHub CI, no paid runners).
# Usage: ./scripts/test_local.sh [--live]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== NodeAI local test suite =="
echo ""

echo ">> 1/6 Rust unit + wiremock integration"
cargo test -p nodeai-core -p nodeai-proxy -p nodeai-runtime
echo ""

echo ">> 2/6 Frontend unit tests (vitest)"
(cd apps/desktop && npm test)
echo ""

echo ">> 3/6 Frontend typecheck + build"
(cd apps/desktop && npm run build)
echo ""

echo ">> 4/6 Agent + BYOK script smoke"
"$ROOT/scripts/test_agent.sh"
"$ROOT/scripts/test_byok.sh"
echo ""

echo ">> 5/6 Proxy smoke (requires running proxy on 8787)"
if curl -sf "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
  NODEAI_PROXY_URL="${NODEAI_PROXY_URL:-http://127.0.0.1:8787}" "$ROOT/scripts/test_integration.sh"
  NODEAI_PROXY_URL="${NODEAI_PROXY_URL:-http://127.0.0.1:8787}" "$ROOT/scripts/test_prune.sh"
else
  echo "SKIP: proxy not running on 8787 (start with: ./scripts/dev.sh)"
fi
echo ""

echo ">> 5b/6 Cloud dev smoke (8788)"
"$ROOT/scripts/ensure_cloud.sh"
curl -sf "${NODEAI_CLOUD_BASE_URL:-http://127.0.0.1:8788}/health" | python3 -m json.tool | head -8 || {
  echo "FAIL: Cloud health check failed"
  exit 1
}
echo ""

if [[ "${1:-}" == "--live" ]]; then
  echo ">> 6/6 Live Gateway (needs .env AI_GATEWAY_API_KEY)"
  if [[ -f "$ROOT/.env" ]] && grep -qE '^AI_GATEWAY_API_KEY=.+' "$ROOT/.env" 2>/dev/null; then
    cargo test -p nodeai-proxy -- --ignored live_
  else
    echo "SKIP: no AI_GATEWAY_API_KEY in .env"
  fi
else
  echo ">> 6/6 Live Gateway skipped (pass --live to enable)"
fi

echo ""
echo "PASS: local test suite completed"
