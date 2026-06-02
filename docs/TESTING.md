# NodeAI 本地测试（无需 GitHub CI / 不花钱）

## 一键跑全套

```bash
./scripts/test_local.sh
```

包含：

1. Rust 单元测试 + **wiremock 集成测试**（无需 Gateway Key）
2. 前端 **Vitest**（SSE 解析、附件拼装）
3. `npm run build` 类型检查
4. 若 8787 代理在跑 → `test_integration.sh` smoke
5. 可选 `./scripts/test_local.sh --live` → 真 Gateway（需 `.env`）

## 分层说明

| 层 | 命令 | 需要密钥 | 说明 |
|----|------|----------|------|
| L1 Rust 单元 | `cargo test -p nodeai-core -p nodeai-proxy` | 否 | RTK/Caveman、Smart Route、Failover 状态码 |
| L1 wiremock | 同上（`tests/gateway_local.rs`） | 否 | 429 换路、Embeddings、BYOK 转发 |
| L1 前端 | `cd apps/desktop && npm test` | 否 | 纯函数 |
| L2 Smoke | `./scripts/test_integration.sh` | 可选 | 代理已启动时 |
| L3 Live | `cargo test -p nodeai-proxy -- --ignored live_` | 是 | 真 Vercel Gateway |

## 本机完整使用（推荐）

```bash
# 一键：Cloud :8788 + 桌面 Tauri dev（8787 内嵌）
./scripts/dev.sh

# 或分开两个终端：
cargo run -p nodeai-cloud --bin nodeai-cloud-dev --release   # :8788
cd apps/desktop && npm run tauri dev                           # 内嵌 8787
```

**前置：**

1. `~/.nodeai/.env` 中 `AI_GATEWAY_API_KEY=`（模型目录 + Chat 含额度路径）
2. Debug 构建会尝试自动启动 Cloud dev（若 8788 未监听）

桌面与 8787 **默认 Cloud** = `http://127.0.0.1:8788`（无远程 `api.nodeai.app`）。

## 开发时常用

```bash
# 只跑 Rust（最快）
cargo test -p nodeai-core -p nodeai-proxy

# 只跑前端
cd apps/desktop && npm test

# 启动代理后 smoke
cargo run -p nodeai-proxy --bin nodeai-proxy-standalone
./scripts/test_integration.sh
```

## BYOK / Cloud 本地测

- BYOK Key：`NODEAI_BYOK_KEY_{SOURCE_ID}` 环境变量可覆盖 Keychain（见 `byok.rs` 测试）
- Cloud 默认 `http://127.0.0.1:8788`；含额度请求须 `X-NodeAI-Cloud-Token: nodeai_session_*`
- `/health` 返回 `cloud.reachable` 与 `cloud.gateway_registry`（是否已配 Gateway Key）
