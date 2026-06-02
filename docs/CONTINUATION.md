# NodeAI 开发接续说明（Agent / 新会话用）

**最后更新：** 2026-06-02  
**用途：** 在新 Cursor 会话中恢复上下文，避免重复探索。

---

## 产品约束（不可违背）

见 [docs/PRD.md](PRD.md)、[.cursor/rules/nodeai-product.mdc](../.cursor/rules/nodeai-product.mdc)、[.cursor/rules/nodeai-architecture.mdc](../.cursor/rules/nodeai-architecture.mdc)。

**用户规则：** 默认**不要** `git commit`，除非用户明确要求。

---

## 仓库结构

```
NodeAI/
├── apps/desktop/          # Tauri 2 + React 19
│   └── src/lib/
│       ├── gateway/       # Gateway API + 字段归一化（定价）
│       ├── model/         # GatewayModel、pool、pricing
│       ├── catalog/       # 目录 UI 逻辑
│       ├── chat/          # SSE 流式 + 请求头
│       └── route/         # VPN 线路展示
├── crates/nodeai-core/    # Bonus(RTK/Caveman)、intent 映射、配置
├── crates/nodeai-cloud/   # Cloud API 客户端 + dev 服务（Gateway Key 服务端）
├── crates/nodeai-proxy/   # 8787 边缘：Cloud relay、BYOK、Bonus 管道、SQLite 用量
└── prototypes/            # dashboard.html 对照源
```

---

## 已完成（MVP 当前）

| 能力 | 说明 |
|------|------|
| **NodeAI Cloud 模型目录** | 桌面 Session → 8787 → Cloud `/v1/models`；Gateway Key **仅 Cloud dev/生产服务端** |
| **8787 代理** | health、models（Cloud 拉取）、chat（Cloud relay + SSE）、usage、bonus 配置 |
| **RTK + Caveman L1** | 出站前压缩/简洁 system；`x-nodeai-bonus` 头；`/v1/nodeai/usage` 分项 |
| **Smart Route（代理层）** | `X-NodeAI-Intent` + `X-NodeAI-Smart-Route` → 按场景改 model |
| **Chat** | 真 SSE 流式；记忆注入 header；首次 Chat 激活 |
| **SQLite 用量** | `~/.nodeai/usage.db` 持久化 app 计数 + bonus 指标 |
| **429 Failover** | 设置 `failover` 开启时 Gateway 429/503 自动换 `gemini-2.5-flash` |
| **Embeddings** | `POST /v1/embeddings` 经 Cloud relay（需 Session） |
| **BYOK 路由** | `sources.json` + Keychain Key → proxy `X-NodeAI-Path: byok` 转发 |
| **Cloud 鉴权** | Keychain session；默认 Cloud = `http://127.0.0.1:8788` |
| **原生托盘** | macOS/Windows menu bar 图标 + 打开/退出 |
| **Chat 附件** | 文件/图片 chips，多模态 messages |
| **UI** | 模型目录（Cloud 价、厂商筛选吸顶）、设置↔bonus API、Hub/Billing/Menubar 读 live metrics |

### 本地 Cloud dev 流程

```bash
# 终端 1：Cloud API（~/.nodeai/.env 需 AI_GATEWAY_API_KEY，仅服务端）
cargo run -p nodeai-cloud --bin nodeai-cloud-dev --release

# 终端 2：8787 边缘（可选；Tauri 内嵌代理时可省略）
cargo run -p nodeai-proxy --bin nodeai-proxy-standalone --release

# 桌面：侧栏登录 → 打开模型目录应见完整 registry
```

---

## 仍待做

| ☐ | NodeAI Cloud **远程生产**部署（当前仅 localhost:8788） |
- `nodeai-runtime` 格式转换、Agent 工具确认
- macOS/Windows CI 打包签名

## 本地测试

见 [docs/TESTING.md](TESTING.md) — `./scripts/test_local.sh`，**无需 GitHub Pro / 云端 CI**。

---

## 验证

```bash
cd apps/desktop && npm run build
cargo test -p nodeai-core -p nodeai-proxy
cargo test -p nodeai-proxy -- --ignored live_   # 需 .env Gateway key
./scripts/test_integration.sh                   # 或 NODEAI_PROXY_URL=...
cd apps/desktop && npm run tauri dev
```

**手动：** 对话发消息应看到逐字 SSE；`curl /v1/nodeai/usage` 重启后仍保留计数（SQLite）。
