#!/usr/bin/env bash
# Prune E2E smoke: oversized history + prune enabled → x-nodeai-bonus prune=1
set -euo pipefail

BASE="${NODEAI_PROXY_URL:-http://127.0.0.1:8787}"
V1="$BASE/v1"

echo "== NodeAI Prune E2E =="
echo "Proxy: $BASE"

curl -sf "$BASE/health" >/dev/null || {
  echo "FAIL: proxy not reachable on $BASE"
  exit 1
}

echo "1) Enable prune profile"
curl -sf -X PUT "$V1/nodeai/bonus" \
  -H "Content-Type: application/json" \
  -d '{"rtk":true,"caveman_level":1,"prune":true,"memory_inject":true,"smart_route":true,"failover":true}' \
  >/dev/null

echo "2) Send oversized chat payload"
PRUNE_BODY="$(python3 <<'PY'
import json
messages = [{"role": "system", "content": "You are helpful."}]
for i in range(48):
    messages.append({"role": "user", "content": f"Turn {i}: " + ("explain Rust ownership " * 40)})
    messages.append({"role": "assistant", "content": f"Ack {i}: " + ("summary " * 30)})
print(json.dumps({
    "model": "google/gemini-2.5-flash",
    "messages": messages,
    "max_tokens": 8,
    "stream": False,
}))
PY
)"

resp="$(curl -si -X POST "$V1/chat/completions" \
  -H "Authorization: Bearer sk-nodeai-chat" \
  -H "Content-Type: application/json" \
  -H "X-NodeAI-Context-Window: 4096" \
  -d "$PRUNE_BODY")"

bonus_hdr="$(echo "$resp" | awk 'BEGIN{IGNORECASE=1} /^x-nodeai-bonus:/ {sub(/^[^:]*:[ ]*/,""); print; exit}')"
echo "x-nodeai-bonus: ${bonus_hdr:-missing}"

if echo "$bonus_hdr" | grep -q "prune=1"; then
  echo "PASS: prune applied"
else
  echo "FAIL: expected prune=1 in bonus header"
  exit 1
fi

if echo "$bonus_hdr" | grep -q "prune_saved="; then
  saved="$(echo "$bonus_hdr" | sed -n 's/.*prune_saved=\([0-9]*\).*/\1/p')"
  if [ "${saved:-0}" -gt 0 ]; then
    echo "PASS: prune_saved=$saved"
  else
    echo "WARN: prune_saved is zero (trim may still have occurred)"
  fi
fi

echo "PASS: prune E2E completed"
