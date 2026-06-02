#!/usr/bin/env bash
# BYOK format conversion smoke via wiremock-backed unit tests.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== NodeAI BYOK format E2E (Rust integration) =="
cargo test -p nodeai-proxy byok -- --nocapture
cargo test -p nodeai-runtime format::tests -- --nocapture
echo "PASS: BYOK forward + format conversion tests"
