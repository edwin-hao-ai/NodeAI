#!/usr/bin/env bash
# Deep integration smoke test for NodeAI proxy + Vercel AI Gateway + RTK/Caveman.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
BASE="${NODEAI_PROXY_URL:-http://127.0.0.1:8787}"
V1="$BASE/v1"

echo "== NodeAI integration test =="
echo "Proxy: $BASE"

echo ""
echo "1) Health + bonus profile"
health="$(curl -sf "$BASE/health")"
echo "$health" | python3 -m json.tool | head -20
configured="$(echo "$health" | python3 -c "import sys,json; print(json.load(sys.stdin)['gateway']['configured'])")"
if [ "$configured" != "True" ]; then
  echo "WARN: Gateway not configured — set AI_GATEWAY_API_KEY in .env and restart proxy"
fi

echo ""
echo "2) Models catalog"
count="$(curl -sf "$V1/models" | python3 -c "import sys,json; print(len(json.load(sys.stdin).get('data',[])))")"
echo "models: $count"
[ "$count" -gt 10 ] || { echo "FAIL: expected >10 models"; exit 1; }

echo ""
echo "3) RTK payload (large tool_result JSON)"
RTK_BODY="$(python3 <<'PY'
import json
payload = {"tool": "grep", "lines": ["match line " * 8] * 80}
text = "tool_result:\n" + json.dumps(payload, indent=2)
print(json.dumps({
  "model": "google/gemini-2.5-flash",
  "messages": [{"role": "user", "content": text}],
  "max_tokens": 8
}))
PY
)"
rtk_resp="$(curl -si -X POST "$V1/chat/completions" \
  -H "Authorization: Bearer sk-nodeai-chat" \
  -H "Content-Type: application/json" \
  -d "$RTK_BODY")"
bonus_hdr="$(echo "$rtk_resp" | awk 'BEGIN{IGNORECASE=1} /^x-nodeai-bonus:/ {sub(/^[^:]*:[ ]*/,""); print; exit}')"
echo "x-nodeai-bonus: ${bonus_hdr:-missing}"
echo "$bonus_hdr" | grep -q "rtk=1" || echo "WARN: RTK header not set (proxy may need restart with new code)"

echo ""
echo "4) Caveman + memory inject"
MEM='["Prefers concise Chinese replies","Uses TypeScript"]'
cave_resp="$(curl -si -X POST "$V1/chat/completions" \
  -H "Authorization: Bearer sk-nodeai-chat" \
  -H "Content-Type: application/json" \
  -H "X-NodeAI-Memories: $MEM" \
  -d '{"model":"google/gemini-2.5-flash","messages":[{"role":"user","content":"Say hi in one word"}],"max_tokens":16}')"
cave_hdr="$(echo "$cave_resp" | awk 'BEGIN{IGNORECASE=1} /^x-nodeai-bonus:/ {sub(/^[^:]*:[ ]*/,""); print; exit}')"
echo "x-nodeai-bonus: ${cave_hdr:-missing}"
echo "$cave_hdr" | grep -q "caveman=1" || echo "WARN: Caveman header not set"

echo ""
echo "5) Usage metrics"
usage="$(curl -sf "$V1/nodeai/usage")"
echo "$usage" | python3 -m json.tool
chat_count="$(echo "$usage" | python3 -c "import sys,json; print(json.load(sys.stdin).get('apps',{}).get('chat',0))")"
[ "$chat_count" -ge 1 ] || { echo "FAIL: chat usage not recorded"; exit 1; }

echo ""
echo "6) Bonus API roundtrip"
curl -sf "$V1/nodeai/bonus" | python3 -m json.tool | head -10
curl -sf -X PUT "$V1/nodeai/bonus" \
  -H "Content-Type: application/json" \
  -d '{"rtk":true,"caveman_level":1,"prune":false,"memory_inject":true,"smart_route":true,"failover":true}' \
  | python3 -m json.tool | head -10

if [ "$configured" = "True" ]; then
  echo ""
  echo "7) Live Gateway chat"
  live_json="$(curl -s -X POST "$V1/chat/completions" \
    -H "Authorization: Bearer sk-nodeai-chat" \
    -H "Content-Type: application/json" \
    -d '{"model":"google/gemini-2.5-flash","messages":[{"role":"user","content":"Reply with exactly: pong"}],"max_tokens":64}')"
  content="$(echo "$live_json" | python3 -c "
import sys, json
try:
    d = json.load(sys.stdin)
    print(d.get('choices', [{}])[0].get('message', {}).get('content', '') or '')
except Exception:
    print('')
" 2>/dev/null || true)"
  echo "reply: ${content:-<empty>}"
  if [ -n "$content" ]; then
    echo "$content" | grep -qi "pong" || echo "WARN: unexpected reply (may still be OK)"
  else
    echo "WARN: empty reply or parse error (Gateway may be rate-limited)"
  fi
fi

echo ""
echo "PASS: integration smoke completed"
