#!/usr/bin/env bash
# Agent FS unit smoke via nodeai-runtime (no Tauri UI required).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== NodeAI Agent FS E2E (Rust unit) =="
cargo test -p nodeai-runtime agent::tests -- --nocapture
echo "PASS: agent read/write/delete sandbox tests"
