#!/usr/bin/env bash
# Run all local tests (no GitHub CI, no paid runners).
# Usage: ./scripts/test_local.sh [--live]
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== NodeAI local test suite =="
echo ""

echo ">> 1/4 Rust unit + wiremock integration"
cargo test -p nodeai-core -p nodeai-proxy
echo ""

echo ">> 2/5 Frontend unit tests (vitest)"
(cd apps/desktop && npm test)
echo ""

echo ">> 3/5 Frontend typecheck + build"
(cd apps/desktop && npm run build)
echo ""

echo ">> 4/5 Proxy smoke (requires running proxy on 8787)"
if curl -sf "http://127.0.0.1:8787/health" >/dev/null 2>&1; then
  NODEAI_PROXY_URL="${NODEAI_PROXY_URL:-http://127.0.0.1:8787}" "$ROOT/scripts/test_integration.sh"
else
  echo "SKIP: proxy not running on 8787 (start with: cargo run -p nodeai-proxy --bin nodeai-proxy-standalone)"
fi
echo ""

if [[ "${1:-}" == "--live" ]]; then
  echo ">> 5/5 Live Gateway (needs .env AI_GATEWAY_API_KEY)"
  if [[ -f "$ROOT/.env" ]] && grep -qE '^AI_GATEWAY_API_KEY=.+' "$ROOT/.env" 2>/dev/null; then
    cargo test -p nodeai-proxy -- --ignored live_
  else
    echo "SKIP: no AI_GATEWAY_API_KEY in .env"
  fi
else
  echo ">> 5/5 Live Gateway skipped (pass --live to enable)"
fi

echo ""
echo "PASS: local test suite completed"
